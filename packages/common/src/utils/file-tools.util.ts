import fs from 'fs-extra'
import { createPrompt, ListrTaskWrapper } from 'listr2'
import path from 'path'
import { parse as yamlParse, stringify as convertToYaml } from 'yaml'

import { jsonExtensions, yamlExtensions } from './file-tools.constants'
import { Logger } from '@extend/logger'
import { ObjectLiteral } from '@interfaces/object-literal.interface'

const logger = Logger.prototype.getInstance('file')

/** Prompt for overwrite. */
export async function promptOverwrite (file: string): Promise<void> {
  // return if file does not already exists
  if (!checkExists(file)) {
    return
  }

  // get prompt for overwrite
  const reply = await createPrompt({
    type: 'Toggle',
    message: `"${file}" already exists. Do you want to overwrite?`,
    enabled: 'Overwrite',
    disabled: 'Cancel'
  })

  // quit if overwrite permission not given
  if (!reply) {
    logger.critical(`Permission to overwrite "${file}" has not been granted. Exiting.`)
    process.exit(20)
  }
}

/** Prompt for overwrite inside a Listr2 task.
 *  This needs it to be wrapped around a task object since the output will be pushed through Listr2 itself. */
export async function tasksOverwritePrompt (file: string, task: ListrTaskWrapper<any, any>): Promise<void> {
  // return if file does not already exists
  if (!checkExists(file)) {
    return
  }

  // get prompt for overwrite
  const reply = await task.prompt<boolean>({
    type: 'Toggle',
    message: `"${file}" already exists. Do you want to overwrite?`,
    enabled: 'Overwrite',
    disabled: 'Cancel'
  })

  // quit if overwrite permission not given
  if (!reply) {
    logger.critical(`Permission to overwrite "${file}" has not been granted. Exiting.`)
    process.exit(20)
  }
}

/** Check file exists. The shortest way to do it still is with the legacy one. */
export function checkExists (file: string): boolean {
  return fs.existsSync(file)
}

/** Creates a directory if not already exists. */
export async function createDirIfNotExists (directory: string): Promise<void> {
  try {
    // get directory path from given string
    const dirPath = getDirectoryFromPath(directory)

    // create directory
    if (dirPath) {
      await fs.ensureDir(dirPath)
    } else {
      logger.debug(`Not a valid dirpath for: ${dirPath}`)
    }
  } catch (e) {
    logger.critical(`Unable to create non existing configuration directory at ${directory}. Please check permissions.`)
    logger.debug(e)
    process.exit(20)
  }
}

/** Get a directory name from a path.
 * Must be careful with while using a filename with no extension, because it relies on extension to find path. */
export function getDirectoryFromPath (directory: string): string | void {
  // if does not have extension return immediately
  if (!path.extname(directory)) {
    return directory
  }

  // split for directory path
  directory = directory.toString()
  const directoryArray = directory.split('/')
  if (directoryArray.length > 0) {
    directoryArray.pop()
    directory = directoryArray.join('/')
    return directory
  }
}

/** Just to read YAML or JSON files. */
export async function readFile<T extends ObjectLiteral> (file: string): Promise<T> {
  if (!checkExists(file)) {
    throw new Error(`File:"${file}" does not exists, or insufficient permissions.`)
  }

  const ext = path.extname(file)
  const fileContents = await readRaw(file)
  let parsedFile: T

  try {
    if (jsonExtensions.includes(ext)) {
      parsedFile = JSON.parse(fileContents)
    } else if (yamlExtensions.includes(ext)) {
      parsedFile = parseYaml<T>(fileContents)
    }

    return parsedFile
  } catch {
    logger.critical(`"${file}" is not a valid "${ext}" file.`)
    process.exit(20)
  }
}

/** Directly read files without parsing. */
export function readRaw (file: string): Promise<string> {
  try {
    return fs.readFile(file, 'utf-8')
  } catch (e) {
    logger.critical(`Error reading from "${file}".`)
    logger.debug(e)
    process.exit(20)
  }
}

/** Write to a file. */
export async function writeFile (file: string, data: string | string[] | ObjectLiteral, append = false, parse = true): Promise<void> {
  try {
    // parse if send as json or yaml form
    const ext = path.extname(file)

    if (parse) {
      // parse json and yaml
      if (jsonExtensions.includes(ext)) {
        data = toJson(data)
      }
      if (yamlExtensions.includes(ext)) {
        data = toYaml(data)
      }

      // split if send in array form
      if (Array.isArray(data)) {
        data = data.join('\n')
      }
    }

    // write file
    if (append) {
      await fs.appendFile(file, data, { encoding: 'utf-8' })
    } else {
      await fs.writeFile(file, data, 'utf-8')
    }
  } catch (e) {
    logger.critical(`Unable to generate "${file}". Please check permissions if overwriting over existing one.`)
    logger.debug(e)
    process.exit(20)
  }
}

/** Delete a file. */
export async function deleteFile (file: string): Promise<void> {
  try {
    if (fs.existsSync(file)) {
      await fs.unlinkSync(file)
    } else {
      logger.info(`"${file}" not found.`)
    }
  } catch (e) {
    logger.critical(`Error deleting file from "${file}".`)
    logger.debug(e)
    process.exit(20)
  }
}

/** Stringfy a object to JSON. */
export function toJson (data: string | string[] | ObjectLiteral): string {
  return JSON.stringify(data, null, 2)
}

/** Parses a YAML input. */
// these are exposed to maybe later change the yaml parser
export function parseYaml<T extends ObjectLiteral> (data: string): T {
  try {
    return yamlParse(data)
  } catch (e) {
    logger.critical('Can not read yaml file.')
    logger.debug(e)
    process.exit(21)
  }
}

/** Stringfy a object to yaml. */
export function toYaml (data: string | string[] | ObjectLiteral): string {
  return convertToYaml(data, {})
}

/** To leave spaces between comment charachters in the given long string. */
export function spacesBetweenComments<T extends string | string[]> (data: T, comment: string): T extends string ? string : string[] {
  let parsedData: string

  if (Array.isArray(data)) {
    parsedData = data.join('\n')
  } else {
    parsedData = data as string
  }

  const result: string[] = parsedData.split('\n').reduce((o, value, index) => {
    if (new RegExp(`^[ ]*${comment}.*`).test(value) && index !== 0) {
      o.push('', value)
    } else if (value !== '') {
      o.push(value)
    }

    return o
  }, [])

  if (Array.isArray(data)) {
    return result as any
  } else {
    return result.join('\n') as any
  }
}
