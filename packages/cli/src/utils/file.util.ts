import globby from 'globby'

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

export function findFilesInDirectory (directories: string | string[], files: string | string[]): Promise<string[]> {
  return globby(parseFileNamesInDirectory(directories.toString(), files.toString()))
}
