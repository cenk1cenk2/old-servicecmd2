import { Hook } from '@oclif/config'
import Help from '@oclif/plugin-help'

import { Logger } from '@extend/logger'

const hook: Hook<'command_not_found'> = async (opts) => {
  const logger = Logger.prototype.getInstance(opts.config.name)

  // show info
  logger.critical('Command not found. Take a look at help. You can also use -[h]elp flag for subcommands.', { custom: opts.config.name })
  logger.direct('')

  // show help
  const help = new Help(opts.config)
  help.showHelp([ '--all' ])

  process.exit(126)
}

export default hook
