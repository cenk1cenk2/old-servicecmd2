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
    force: Flags.boolean({ char: 'f' }),
    regex: Flags.string({
      char: 'r',
      multiple: true,
      description: 'Add services with JavaScript regular expression pattern filtering by entry name.'
    }),
    ignore: Flags.string({
      char: 'i',
      multiple: true,
      description: 'Ignore services with JavaScript regular expression pattern filtering directly.'
    }),
    service: Flags.string({
      char: 's',
      multiple: true,
      description: 'Directly target a service with regular expression.'
    }),
    target: Flags.string({
      char: 't',
      description: 'Target a container directly in docker-compose file.'
    })
  }

  static args: Args.IArg[] = [
    {
      name: 'command',
      description: 'Execute the command.',
      options: Object.keys(DockerCommandsAvailable),
      required: true
    },
    {
      name: 'service',
      description: [
        'Filter services by name to apply the command on.',
        `Defaults to "${DockerCommandConstants.ALL_SERVICES}" services.`
      ].join('\n')
    }
  ]

  private deferred: (() => Promise<any>)[] = []

  async run (): Promise<void> {
    // get arguments
    const { args, flags, argv } = this.parse(DockerCommand)
    // get services as rest of the arguments
    argv.splice(argv.indexOf(args.command), 1)
    args.service = argv.length === 0 ? null : argv

    // set defaults
    if (!args.service && !flags.regex && !flags.service) {
      args.service = DockerCommandConstants.ALL_SERVICES
    }

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

      // execute preliminary actions
      {
        title: 'Parsing all the services...',
        enabled: !!flags.service,
        task: async (ctx, task): Promise<void> => {
          ctx.allServices = []
          await Promise.all(
            Object.values(ctx.config).map(async (service) => {
              ctx.allServices.push(...await findFilesInDirectory(service.path, service.file, { deep: typeof service.regex === 'number' ? service.regex : 1 }))
            })
          )

          ctx.allServices = ctx.allServices.filter(uniqueArrayFilter)

          task.title = `Discovered ${ctx.allServices.length} services in total.`
        }
      },

      // Scan for services
      {
        title: 'Scanning for services...',
        task: async (ctx, task): Promise<void> => {

          // filter the services
          task.output = 'Filtering services...'
          ctx.services = []
          ctx.discoveredServices = []

          // when the services or regex is defined
          if (args.service !== DockerCommandConstants.ALL_SERVICES) {
            // preliminary filtering
            await Promise.all([
              // direct services as arguments
              ...args.service?.length > 0 ? args.service.map(async (service) => {
                const s = Object.keys(ctx.config).filter((s) => service === s)
                if (s.length > 0) {
                  task.output = `Found matching service by name: ${s.toString()}`
                }
                ctx.services.push(...s)
              }) : [ Promise.resolve() ],

              // regex services
              ...flags.regex?.length > 0 ? flags.regex.map(async (service) => {
                const s = Object.keys(ctx.config).filter((s) => new RegExp(service).test(s))
                if (s.length > 0) {
                  task.output = `Found matching service by regex pattern: ${s.toString()}`
                }
                ctx.services.push(...s)
              }) : [ Promise.resolve() ],

              // direct service targetting
              flags.service?.length > 0 ? (async (): Promise<void> => {
                await Promise.all(
                  flags.service.map(async (service) => {
                    const s = ctx.allServices.filter((s) => new RegExp(service).test(s))
                    if (s.length > 0) {
                      task.output = `Found matching service by direct pattern: ${s.toString()}`
                    }
                    ctx.discoveredServices.push(...s)
                  })
                )
              })() : [ Promise.resolve() ]
            ])

            // create unique array of services
            ctx.services = ctx.services.filter(uniqueArrayFilter)

            // the user wants to run over default of all services
          } else {
            ctx.services = Object.keys(ctx.config)
          }

          task.output = 'Grouping services together...'
          await Promise.all(
            ctx.services.map(async (service) => {
              const current = ctx.config[service]
              const services = await findFilesInDirectory(current.path, current.file, { deep: typeof current.regex === 'number' ? current.regex : 1 })
              if (services.length > 0) {
                task.output = `Discovered service: ${services.toString()}`
                ctx.discoveredServices.push(...services)
              }
            })
          )

          // filter services to be unique
          ctx.discoveredServices = ctx.discoveredServices.filter(uniqueArrayFilter)

          // secondary filtering
          await Promise.all([
            // ignore unwanted services
            flags.ignore?.length > 0 ? flags.ignore.map((service) => {
              const s = ctx.discoveredServices.filter((s) => !new RegExp(service).test(s))
              task.output = `Ignoring matching service by regex pattern: ${service}`
              ctx.discoveredServices = s
            }) : [ Promise.resolve() ]
          ])

          if (ctx.discoveredServices.length === 0) {
            throw new Error('No matching service name has been found.')
          }

          task.title = `Found ${ctx.discoveredServices.length} matching services in configuration.`

          ctx.parsedServices = groupFilesInFolders(ctx.discoveredServices)

          this.message.debug('Applying on services:\n%o', ctx.parsedServices)

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
              if (file.length === 0) {
                throw new Error(`Can not find any services: ${folder}`)
              }

              return task.newListr(file.map((f) => (
                {
                  title: f,
                  task: async (ctx, task): Promise<void> => {
                    // the command itself
                    const args: string[] = []
                    if (flags.target) {
                      args.push(flags.target)
                    }

                    const instance = execa(ctx.command.command, [ ...args ], {
                      cwd: folder, shell: true
                    })

                    // create a log out function for execa
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

                    // defer the task logging or log it directly
                    if (!ctx.command.deffered) {
                      await createOutputStream()
                    } else {
                      this.deferred.push(
                        createOutputStream
                      )
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

    await this.tasks.runAll()
    if (this.deferred.length > 0) {
      this.deferred.forEach(async (defer) => {
        await defer()
      })
    }
    this.message.pop()
  }
}
