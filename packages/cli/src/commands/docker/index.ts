import { BaseCommand, LogLevels, createTable } from '@cenk1cenk2/boilerplate-oclif'
import { flags as Flags } from '@oclif/command'
import { IBooleanFlag, IOptionFlag } from '@oclif/parser/lib/flags'
import execa from 'execa'
import { WriteStream } from 'fs'
import { Listr } from 'listr2'
import { EOL } from 'os'
import { dirname } from 'path'
import through from 'through'

import { ServiceConfig } from '@context/config/services.interface'
import { dockerCommandFlagsWithLimitation } from '@context/docker/index.constants'
import { DockerCommandConstants, DockerCommandFlagsWithLimitationTypes, dockerCommandsAvailable } from '@interfaces/commands/docker/index.constants'
import { DockerCommandCtx } from '@src/interfaces/commands/docker/index.interface'
import { ConfigFileConstants } from '@src/interfaces/constants'
import { findFilesInDirectory, getFolderName, groupFilesInFolders } from '@src/utils/file.util'
import { nullArrayValueFilter, uniqueArrayFilter } from '@utils/general.util'

export default class DockerCommand extends BaseCommand {
  static description = 'Runs the designated command over the the intended services.'
  static flags: Record<'limit' | 'ignore' | 'group', IOptionFlag<string[]>> &
  Record<'run', IOptionFlag<string>> &
  Record<'prompt', IBooleanFlag<boolean>> &
  Partial<Record<DockerCommandFlagsWithLimitationTypes, IOptionFlag<any> | IBooleanFlag<boolean>>> = {
    run: Flags.string({
      char: 'r',
      multiple: false,
      description: 'Execute the given command.',
      options: Object.keys(dockerCommandsAvailable),
      required: true
    }),
    group: Flags.string({
      char: 'g',
      multiple: true,
      description: 'Limit the task with service group name.',
      default: [ DockerCommandConstants.ALL_SERVICES ]
    }),
    limit: Flags.string({
      char: 'l',
      multiple: true,
      description: 'Limit a service utilizing JavaScript regex pattern depending on the final folder location.'
    }),
    ignore: Flags.string({
      char: 'i',
      multiple: true,
      description: 'Ignore a service utilizing JavaScript regex pattern depending on the final folder location.'
    }),
    prompt: Flags.boolean({
      char: 'p',
      description: 'Prompt user before doing something.'
    }),
    // flags with limitation
    ...dockerCommandFlagsWithLimitation.reduce(
      (o, s) => ({
        ...o,
        [s.name]: Flags[s.type]({
          char: s.useChar ? (s.name.charAt(0) as any) : null,
          description: [
            ...s.description,
            `Works with commands: "${Object.entries(dockerCommandsAvailable)
              .reduce((o, [ k, v ]) => v.limitedFlags?.includes(s.name) ? [ ...o, k ] : o, [])
              .join(', ')}"`
          ].join(' '),
          ...(s.options as any)
        })
      }),
      {}
    )
  }

  private deferred: (() => Promise<any>)[] = []

  async run (): Promise<void> {
    // get arguments
    const { flags } = this.parse(DockerCommand)

    // parse command
    this.tasks.ctx = { command: dockerCommandsAvailable[flags.run] }

    // check arguments
    await Promise.all(
      Object.values(DockerCommandFlagsWithLimitationTypes).map(async (f) => {
        if (flags[f] && !dockerCommandsAvailable[flags.run].limitedFlags?.includes(f)) {
          throw new Error(`Specifiying a "${f}" flag is not available for command "${flags.run}".`)
        }
      })
    )

    this.tasks.add<DockerCommandCtx>([
      // read configuration file
      {
        task: async (ctx): Promise<void> => {
          try {
            ctx.config = (await this.getConfig<ServiceConfig>(ConfigFileConstants.SERVICES_CONFIG)).config
          } catch (e) {
            throw new Error('Configuration file not found. Please use the config menu to create one.')
          }
        }
      },

      // scan for services
      {
        title: 'Scanning for services...',
        task: async (ctx, task): Promise<void> => {
          // filter the services
          task.output = 'Filtering services...'
          ctx.services = []

          // find matching services
          let services = flags.group.includes(DockerCommandConstants.ALL_SERVICES) ? Object.keys(ctx.config) : flags.group

          // create unique array of services
          services = services.filter(uniqueArrayFilter)

          task.output = 'Grouping services together...'
          await Promise.all(
            services.map(async (service) => {
              const current = ctx.config[service]
              if (!current) {
                this.message.warn(`Can not find service for group name "${service}".`)
                return
              }

              const s = await findFilesInDirectory(current.path, current.file, { deep: typeof current.regex === 'number' ? current.regex : 1 })
              if (s.length > 0) {
                task.output = `Discovered service: ${s.toString()}`
                ctx.services.push(...s)
              }
            })
          )

          // filter services to be unique
          ctx.services = ctx.services.filter(uniqueArrayFilter)

          // filter depending on limit
          if (flags?.limit) {
            ctx.services = (
              await Promise.all(
                flags.limit.map(async (service) => {
                  const s = ctx.services.filter((s) => new RegExp(service).test(s))
                  if (s.length > 0) {
                    task.output = `Found matching service by limitting pattern: ${s.toString()}`
                    return s
                  }
                })
              )
            )
              .flat()
              .filter(nullArrayValueFilter)
          }

          // filter depending on ignore
          if (flags?.ignore) {
            await Promise.all(
              flags.ignore.map((service) => {
                const s = ctx.services.filter((s) => !new RegExp(service).test(s))
                task.output = `Ignoring matching service by regex pattern: ${service}`
                ctx.services = s
              })
            )
          }

          // check the filtered results
          if (ctx.services.length === 0) {
            throw new Error('No matching service name has been found.')
          }

          task.title = `Found ${ctx.services.length} matching services in configuration.`

          // parse services by grouping them in folders
          ctx.parsedServices = groupFilesInFolders(ctx.services)

          // check required flags here
          if (ctx.command.requireFlags?.length > 0) {
            await Promise.all(
              ctx.command.requireFlags.map(async (requiredFlag) => {
                if (!flags[requiredFlag]) {
                  throw new Error(`Flag "${requiredFlag}" is required when using it with run command "${flags.run}".`)
                }
              })
            )
          }

          // check limits here
          if (ctx.command.limits?.services) {
            // limit the service count
            if (ctx.services.length > ctx.command.limits.services) {
              throw new Error(`This command can only be applied to ${ctx.command.limits.services} while current filters match ${ctx.services.length} services.`)
            }
          }

          this.logger.debug('Applying on services:\n%o', ctx.parsedServices)
        },
        options: {
          persistentOutput: false
        }
      },

      // prompt user before doing something if flag is specified
      {
        enabled: (): boolean => flags.prompt,
        task: async (ctx, task): Promise<void> => {
          task.output = createTable(
            [ 'Command:', ctx.command.command ],
            [
              [ 'Folder', 'File' ],
              ...Object.entries(ctx.parsedServices).map(([ folder, file ]) => {
                return [ folder, file.join(EOL) ]
              })
            ]
          )
          const prompt = await task.prompt<boolean>({
            type: 'Toggle',
            message: 'Do you confirm the current command?'
          })

          if (!prompt) {
            throw new Error('Cancelled execution.')
          }
        }
      },

      // apply the command on services
      this.tasks.indent(
        (ctx) =>
          Object.entries(ctx.parsedServices).map(([ folder, file ]) => ({
            title: folder,
            task: async (ctx, task): Promise<Listr> => {
              // idiomatic check for empty folders, it should not happen
              if (file.length === 0) {
                throw new Error(`Can not find any services in folder: ${folder}`)
              }

              // create new subtask for every file in folder
              return task.newListr(
                file.map((f) => ({
                  title: f.replace(new RegExp(`${folder}/?`), ''),
                  task: async (ctx, task): Promise<void> => {
                    // parse arguments
                    const args: { start?: string[], middle?: string[], end?: string[] } = {
                      start: [],
                      middle: [],
                      end: []
                    }
                    await Promise.all(
                      Object.keys(flags).map(async (flag) => {
                        if (Object.values(DockerCommandFlagsWithLimitationTypes).includes(flag as any)) {
                          const argument = dockerCommandFlagsWithLimitation.find((i) => i.name === flag)
                          const value = flags[flag]

                          switch (argument.argument) {
                          case 'value-start':
                            args.start.push(value)
                            break
                          case 'value-end':
                            args.end.push(value)
                            break
                          case 'with-double':
                            args.middle.push(`--${flag}`)
                            break
                          case 'with-single':
                            args.middle.push(`-${flag}`)
                            break
                          case 'with-double-and-value':
                            args.middle.push(`--${flag} ${value}`)
                            break
                          case 'with-single-and-value':
                            args.middle.push(`-${flag} ${value}`)
                            break
                          default:
                            throw new Error('Unknown or unhandled argument type.')
                          }
                        }
                      })
                    )

                    // create instance for command
                    const instance = execa(ctx.command.command, [ ...args.start, ...args.middle, ...args.end ], {
                      cwd: folder,
                      shell: true,
                      stdio: ctx.command.headless ? 'inherit' : 'pipe'
                    })

                    // create a log out function depending on the command options
                    const label = getFolderName(dirname(f))
                    const logOut = (loglevel: LogLevels): WriteStream => {
                      return through((chunk: Buffer | string) => {
                        chunk = chunk?.toString('utf-8').trim()

                        if (!ctx.command?.deffered) {
                          task.output = chunk
                        } else {
                          this.logger[loglevel](chunk, { custom: label })
                        }
                      })
                    }

                    // crete the task
                    const execute = async (): Promise<void> => {
                      try {
                        await instance
                      } catch (e) {
                        this.logger.verbose(e.message, { custom: label })
                      }
                    }

                    // create output stream depending on the context
                    const createOutputStream = async (): Promise<void> => {
                      instance.stdout.pipe(logOut(LogLevels.info))
                      instance.stderr.pipe(logOut(LogLevels.warn))

                      await execute()
                    }

                    // defer the task or execute it directly
                    if (ctx.command.headless) {
                      this.deferred.push(execute)
                    } else if (ctx.command.deffered) {
                      this.deferred.push(createOutputStream)
                    } else {
                      await createOutputStream()
                    }
                  },
                  options: {
                    persistentOutput: ctx.command?.keepOutput
                  }
                })),
                {
                  concurrent: true,
                  exitOnError: false,
                  rendererOptions: { collapse: !ctx.command?.keepOutput }
                }
              )
            },
            options: {
              showTimer: true
            }
          })),
        {
          concurrent: true,
          exitOnError: false,
          rendererOptions: { collapse: false }
        },
        { title: `Executing "${flags.run}" command for services.`, options: { showTimer: true } }
      )
    ])

    // specify this implicitly since we have to add defered tasks in between tasks and messages
    // run tasks
    await this.tasks.runAll()

    // run deferred tasks
    if (this.deferred.length > 0) {
      this.deferred.forEach(async (defer) => {
        await defer()
      })
    }

    // pop the messages in queue
    this.message.pop()
  }
}
