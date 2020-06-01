import { Hook } from '@oclif/config'
import cliCursor from 'cli-cursor'
import os from 'os'
import { createInterface } from 'readline'

import { Logger } from '@extend/logger'

const hook: Hook<'prerun'> = async (opts) => {
  const logger = Logger.prototype.getInstance(opts.config.name)

  // graceful terminate
  if (os.platform() === 'win32') {
    createInterface({
      input: process.stdin,
      output: process.stdout
    }).on('SIGINT', () => {
      process.kill(process.pid, 'SIGINT')
    })
  }

  process.on('SIGINT', () => {
    // show that we have understood that
    logger.fail('Caught terminate signal.', { custom: 'exit' })

    // to be sure return the clicursor from listr, this was mostly a bug
    cliCursor.show()

    process.exit(127)
  })
}

export default hook
