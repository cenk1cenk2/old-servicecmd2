import { flags as Flags } from '@oclif/command'
import { args as Args } from '@oclif/parser'
import { BaseCommand } from '@cenk1cenk2/boilerplate-oclif'
import globby from 'globby'
import { Readable } from 'stream'

interface Ctx {
  items: string[]
  scanStream: Readable
}

export default class DockerCommand extends BaseCommand {
  static description = 'describe the command here'

  static flags = {
    help: Flags.help({ char: 'h' }),
    force: Flags.boolean({ char: 'f' })
  }

  static args: Args.Input = [
    {
      name: 'command',
      description: 'asd',
      options: [ 'start', 'stop' ]
    }
  ]

  async run (): Promise<void> {
    const { args, flags } = this.parse(DockerCommand)

    this.tasks.add<Ctx>([
      {
        title: 'Scanning for services.',
        task: async (ctx, task): Promise<NodeJS.ReadableStream> => {
          ctx.items = []
          return globby.stream('**/docker-compose.yml', { cwd: '/root/programs/docker', deep: Infinity }).on('data', (data) => {
            ctx.items = [ ...ctx.items, data ]
          })
        },
        options: {}
      },

      {
        title: 'Found services.',
        task: (ctx, task): void => {
          task.title = ctx.items.toString()
        }
      }
    ])
  }
}
