import { BaseCommand, LogLevels } from '@cenk1cenk2/boilerplate-oclif'
import { flags as Flags } from '@oclif/command'
import { args as Args } from '@oclif/parser'
import execa from 'execa'
import { WriteStream } from 'fs'
import { Listr } from 'listr2'
import { dirname } from 'path'
import through from 'through'

import { ServiceConfig } from '@context/config/services.interface'
import { DockerCommandConstants, DockerCommandFlagsWithLimitation, DockerCommandsAvailable } from '@interfaces/commands/docker/index.constants'
import { DockerCommandCtx } from '@src/interfaces/commands/docker/index.interface'
import { ConfigFileConstants } from '@src/interfaces/constants'
import { findFilesInDirectory, getFolderName, groupFilesInFolders } from '@src/utils/file.util'
import { uniqueArrayFilter } from '@utils/general.util'

export default class DockerCommand extends BaseCommand {
  static description = 'Runs the designated command over the the intended services.'
  static strict = false

  static flags = {
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
    // flags with limitation
    [DockerCommandFlagsWithLimitation.TARGET]: Flags.string({
      char: DockerCommandFlagsWithLimitation.TARGET.charAt(0) as any,
      description: [
        'Target a container directly in docker-compose file.',
        // eslint-disable-next-line max-len
        `Works with commands: "${Object.entries(DockerCommandsAvailable).reduce((o, [ k, v ]) => v.limitedFlags?.includes(DockerCommandFlagsWithLimitation.TARGET) ? [ ...o, k ] : o, [])}"`
      ].join('\n')
    })
  }

  static args: Args.IArg[] = [
    {
      name: 'command',
      description: 'Execute the given command.',
      options: Object.keys(DockerCommandsAvailable),
      required: true
    },
    {
      name: 'service',
      description: 'Limit the task with service group name.',
      default: DockerCommandConstants.ALL_SERVICES
    }
  ]

  private deferred: (() => Promise<any>)[] = []

  async run (): Promise<void> {
    // get arguments
    const { args, flags, argv } = this.parse(DockerCommand)
    // get services as rest of the arguments
    argv.splice(argv.indexOf(args.command), 1)
    args.service = argv

    // parse command
    this.tasks.ctx = { command: DockerCommandsAvailable[args.command] }

    // check arguments
    await Promise.all(Object.values(DockerCommandFlagsWithLimitation).map(async (f) => {
      if (flags[f] && !DockerCommandsAvailable[args.command].limitedFlags?.includes(f)) {
        throw new Error(`Specifiying a "${f}" flag is not available for command "${args.command}".`)
      }
    }))

    this.tasks.add<DockerCommandCtx>([
      // read configuration file
      {
        task: async (ctx): Promise<void> => {
          // read configuration file
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
          let services = args.service.includes(DockerCommandConstants.ALL_SERVICES) ? Object.keys(ctx.config) : args.service

          // create unique array of services
          services = services.filter(uniqueArrayFilter)

          task.output = 'Grouping services together...'
          await Promise.all(services.map(async (service) => {
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
          }))

          // filter services to be unique
          ctx.services = ctx.services.filter(uniqueArrayFilter)

          // filter depending on limit
          if (flags?.limit) {
            await Promise.all(flags.limit.map(async (service) => {
              const s = ctx.services.filter((s) => new RegExp(service).test(s))
              if (s.length > 0) {
                task.output = `Found matching service by limitting pattern: ${s.toString()}`
                ctx.services = s
              }
            }))
          }

          // filter depending on ignore
          if (flags?.ignore) {
            await Promise.all(flags.ignore.map((service) => {
              const s = ctx.services.filter((s) => !new RegExp(service).test(s))
              task.output = `Ignoring matching service by regex pattern: ${service}`
              ctx.services = s
            }))
          }

          // check the filtered results
          if (ctx.services.length === 0) {
            throw new Error('No matching service name has been found.')
          }

          task.title = `Found ${ctx.services.length} matching services in configuration.`

          // parse services by grouping them in folders
          ctx.parsedServices = groupFilesInFolders(ctx.services)

          this.logger.debug('Applying on services:\n%o', ctx.parsedServices)
        },
        options: {
          persistentOutput: false
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
              return task.newListr(file.map((f) => (
                {
                  title: f,
                  task: async (ctx, task): Promise<void> => {
                    // parse arguments
                    const args: string[] = []
                    if (flags.target) {
                      args.push(flags.target)
                    }

                    // create instance for command
                    const instance = execa(ctx.command.command, [ ...args ], {
                      cwd: folder, shell: true
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

                    // create output stream depending on the context
                    const createOutputStream = async (): Promise<void> => {
                      instance.stdout.pipe(logOut(LogLevels.info))
                      instance.stderr.pipe(logOut(LogLevels.warn))

                      try {
                        await instance
                      } catch (e) {
                        this.logger.verbose(e.message, { custom: label })
                      }
                    }

                    // defer the task or execute it directly
                    if (!ctx.command.deffered) {
                      await createOutputStream()
                    } else {
                      this.deferred.push(createOutputStream)
                    }
                  },
                  options: {
                    persistentOutput: ctx.command?.keepOutput
                  }
                }
              )),
              {
                concurrent: true, exitOnError: false, rendererOptions: { collapse: !ctx.command?.keepOutput }
              })
            },
            options: {
              showTimer: true
            }
          })),
        {
          concurrent: true, exitOnError: false, rendererOptions: { collapse: false }
        },
        { title: `Executing "${args.command}" command for services.`, options: { showTimer: true } }
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
