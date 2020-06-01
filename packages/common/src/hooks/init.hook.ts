import { Hook } from '@oclif/config'
import config from 'config'

import { Logger } from '@extend/logger'
import { logo } from '@templates/logo.template'

export const InitHook: Hook<'init'> = async (opts): Promise<void> => {
  // initiate logger
  const logger = Logger.prototype.getInstance(opts.config.name)

  // print logo
  if (config.get('loglevel') !== 'silent') {
    logger.direct(logo(opts.config.version))
  }

  // run default command
  if (!opts.id) {
    try {
      logger.warn('No specific task is defined running the default task which is to git-merge and create docker-compose file.', { custom: opts.id })
    } finally {
      process.exit(0)
    }
  }
}
