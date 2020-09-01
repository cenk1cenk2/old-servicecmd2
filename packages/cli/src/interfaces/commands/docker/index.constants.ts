/* eslint-disable @typescript-eslint/naming-convention */
export enum DockerCommandConstants {
  ALL_SERVICES = 'all'
}

export enum DockerCommandFlagsWithLimitationTypes {
  TARGET = 'target',
  // FORCE_REMOVE = 'remove-orphans'
}

export const DockerCommandFlagsWithLimitation: DockerCommandFlagsWithLimitationInterface[] = [
  {
    name: DockerCommandFlagsWithLimitationTypes.TARGET,
    type: 'string',
    description: [ 'Target a container directly in docker-compose file.' ]
  }
]

export interface DockerCommandFlagsWithLimitationInterface {
  name: DockerCommandFlagsWithLimitationTypes
  type: 'string'
  description: string[]
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
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.TARGET ]
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
  limitedFlags?: DockerCommandFlagsWithLimitationTypes[]
  keepOutput?: boolean
}
