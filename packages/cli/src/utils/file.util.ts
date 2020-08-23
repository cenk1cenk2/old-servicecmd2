import { RegexConstants } from '@interfaces/regex.constants'

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