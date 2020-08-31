import globby from 'globby'
import { dirname } from 'path'

import { ServiceProperties } from '@context/config/services.interface'
import { RegexConstants } from '@interfaces/constants'

export function parseFileNamesInDirectory (directories: string, files: string): string[] {
  return directories.split(RegexConstants.REGEX_SPLITTER).reduce((o, directory) => {
    if (!directory.endsWith('/')) {
      directory = directory + '/'
    }

    files.split(RegexConstants.REGEX_SPLITTER).forEach((file) => {
      o = [ ...o, `${directory}${file}` ]
    })

    return o
  }, [])
}

export function findFilesInDirectory (directories: string | string[], files: string | string[], options?: globby.GlobbyOptions): Promise<string[]> {
  return globby(parseFileNamesInDirectory(directories.toString(), files.toString()), options)
}

export function findFilesInDirectoryWithServiceConfig (config: ServiceProperties, options?: globby.GlobbyOptions): Promise<string[]> {
  return findFilesInDirectory(config.path, config.file, { deep: typeof config.regex === 'number' ? config.regex : 1, ...options })
}

export function groupFilesInFolders (files: string[]): Record<string, string[]> {
  return files.reduce((o, file) => {
    const dir = dirname(file)

    if (o[dir]) {
      o[dir] = [ ...o[dir], file ]
    } else {
      o[dir] = [ file ]
    }

    return o
  }, {})
}

export function getFolderName (path: string): string {
  return path.match(/([^/]*)\/*$/)[1]
}
