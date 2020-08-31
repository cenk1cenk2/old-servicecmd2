/* eslint-disable @typescript-eslint/naming-convention */
export enum DockerCommandConstants {
  ALL_SERVICES = 'all'
}

export const DockerCommandsAvailable = {
  up: 'up',
  down: 'down',
  logs: 'logs'
}

export const DockerCommands = {
  [DockerCommandsAvailable.up]: 'docker-compose up -d',
  [DockerCommandsAvailable.down]: 'docker-compose down',
  [DockerCommandsAvailable.logs]: 'docker-compose logs -f'
}
