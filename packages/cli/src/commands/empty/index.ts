import { flags } from '@oclif/command'
import { BaseCommand } from '@servicecmd/common'

export default class Empty extends BaseCommand {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({ char: 'h' }),
    force: flags.boolean({ char: 'f' })
  }

  static args = [ { name: 'file' } ]

  async run (): Promise<void> {
    // const {args, flags} = this.parse(Index)

    this.logger.module('Hello all.')
  }
}
