import { BaseCommand } from '@cenk1cenk2/boilerplate-oclif'
import { flags as Flags } from '@oclif/command'
import { args as Args } from '@oclif/parser'

import { uniqueArrayFilter } from '../../utils/general.util'
import { ServiceConfig } from './../../interfaces/commands/config/services.interface'
import { DockerCommandConstants, DockerCommandsAvailable } from '@interfaces/commands/docker/index.constants'
import { DockerCommandCtx } from '@src/interfaces/commands/docker/index.interface'
import { ConfigFileConstants } from '@src/interfaces/constants'

export default class DockerCommand extends BaseCommand {
  static description = 'Runs the designated command over the the intended services.'
  static strict = false

  static flags = {
    force: Flags.boolean({ char: 'f' }),
    regex: Flags.string({
      char: 'r',
      multiple: true,
      description: 'Add services with JavaScript regular expression pattern.'
    }),
    ignore: Flags.string({
      char: 'i',
      multiple: true,
      description: 'Ignore services with JavaScript regular expression pattern.'
    })
  }

  static args: Args.IArg[] = [
    {
      name: 'command',
      description: 'Execute the command.',
      options: [ DockerCommandsAvailable.start, DockerCommandsAvailable.stop ],
      required: true
    },
    {
      name: 'service',
      description: `Filter services by name to apply the command on. Defaults to "${DockerCommandConstants.ALL_SERVICES}" services.`
    }
  ]

  async run (): Promise<void> {
    // get arguments
    const { args, flags, argv } = this.parse(DockerCommand)
    // get services as rest of the arguments
    argv.splice(argv.indexOf(args.command), 1)
    args.service = argv.length === 0 ? null : argv

    // set defaults
    if (!args.service && !flags.regex) {
      args.service = DockerCommandConstants.ALL_SERVICES
    }

    this.tasks.add<DockerCommandCtx>([
      // Scan for services
      {
        title: 'Scanning for services...',
        task: async (ctx, task): Promise<void> => {
          // read configuration file
          task.output = 'Reading configuration file...'
          ctx.config = (await this.getConfig<ServiceConfig>(ConfigFileConstants.SERVICES_CONFIG)).config

          // filter the services
          task.output = 'Filtering services...'
          ctx.services = []

          // when the services or regex is defined
          if (args.service !== DockerCommandConstants.ALL_SERVICES) {

            // preliminary filtering
            await Promise.all([
              // direct services as arguments
              ...args.service?.length > 0 ?
                args.service.map(async (service)=> {
                  const s = Object.keys(ctx.config).filter((s) => service === s)
                  task.output = `Found matching service by name: ${s.toString()}`
                  ctx.services = [ ...ctx.services, ...s ]
                })
                : [ Promise.resolve() ],

              // regex services
              ...flags.regex?.length > 0 ?
                flags.regex.map((service) => {
                  const s = Object.keys(ctx.config).filter((s) => new RegExp(service).test(s))
                  task.output = `Found matching service by regex pattern: ${s.toString()}`
                  ctx.services = [ ...ctx.services, ...s ]
                })
                : [ Promise.resolve() ]
            ])

            // create unique array of services
            ctx.services = ctx.services.filter(uniqueArrayFilter)

          // the user wants to run over default of all services
          } else {
            ctx.services = Object.keys(ctx.config)
          }

          // secondary filtering
          await Promise.all([
            // ignore unwanted services
            ...flags.ignore?.length > 0 ?
              flags.ignore.map((service) => {
                const s = ctx.services.filter((s) => !new RegExp(service).test(s))
                task.output = `Ignoring matching service by regex pattern: ${s.toString()}`
                ctx.services = s
              })
              : [ Promise.resolve() ]
          ])

          if (ctx.services.length === 0) {
            throw new Error('No matching services has been found.')
          }

          task.title = `Found ${ctx.services.length} matching services.`
          task.output = ctx.services.join('\n')

          this.message.verbose('Applying on services:\n%o', ctx.services)
        },
        options: {
          persistentOutput: true
        }
      }

      // apply the command on services
    ])
  }
}
