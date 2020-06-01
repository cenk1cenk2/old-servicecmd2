import { flags } from '@oclif/command'
import { BaseCommand } from '@servicecmd/common'

export default class DockerCommand extends BaseCommand {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({ char: 'h' }),
    force: flags.boolean({ char: 'f' })
  }

  static args = [
    {
      name: 'command', required: true, description: 'asd'
    }
  ]

  async run (): Promise<void> {
    const { args, flags } = this.parse()

    this.logger.module('Hello all.')
  }
}
