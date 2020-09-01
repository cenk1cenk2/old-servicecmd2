/* eslint-disable @typescript-eslint/naming-convention */
export enum DockerCommandConstants {
  ALL_SERVICES = 'all'
}

export enum DockerCommandFlagsWithLimitation {
  TARGET = 'target'
}

export const DockerCommandsAvailable: Record<string, DockerCommandsAvailableInterface> = {
  up: {
    command: 'docker-compose up -d'
  },
  down: {
    command: 'docker-compose down'
  },
  logs: {
    command: 'docker-compose logs -f',
    deffered: true,
    limitedFlags: [ DockerCommandFlagsWithLimitation.TARGET ]
  },
  pull: {
    command: 'docker-compose pull'
  },
  build: {
    command: 'docker-compose build'
  },
  ps: {
    command: 'docker-compose ps --all',
    keepOutput: true
  }
}

export interface DockerCommandsAvailableInterface {
  command: string
  deffered?: boolean
  limitedFlags?: DockerCommandFlagsWithLimitation[]
  keepOutput?: boolean
}
