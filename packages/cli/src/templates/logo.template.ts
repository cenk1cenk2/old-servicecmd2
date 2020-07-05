import chalk from 'chalk'

export function logo (version): string {
  return chalk.red(`██╗
╚██╗
  ╚██╗ servicecmd
  ██╔╝ v${version}
██╔╝███████╗
╚═╝ ╚══════╝`)
}
