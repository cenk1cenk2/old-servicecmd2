import { createPrompt, PromptOptions } from 'listr2'

import { Logger } from '@extend/logger'

const logger = Logger.prototype.getInstance('prompt')

/** Gets prompt from user. */
export async function promptUser<T = any> (options: PromptOptions): Promise<T> {
  try {
    return createPrompt(options, {
      stdout: process.stdout,
      cancelCallback: () => {
        logger.fail('Cancelled prompt. Quitting.')
        process.exit(127)
      }
    })
  } catch (e) {
    logger.critical('There was a problem getting the answer of the last question. Quitting.')
    logger.debug(e.trace)
    process.exit(126)
  }
}
