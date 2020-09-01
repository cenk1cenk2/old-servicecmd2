import { DockerCommandFlagsWithLimitationInterface, DockerCommandsAvailableInterface } from './index.interface'

export enum DockerCommandFlagsWithLimitationTypes {
  TARGET = 'target',
  NO_CACHE = 'no-cache',
  PULL = 'pull',
  PARALLEL = 'parallel',
  FORCE_REMOVE = 'force-rm',
  REMOVE_ORPHANS = 'remove-orphans',
  COMMAND = 'command'
}

export const dockerCommandFlagsWithLimitation: DockerCommandFlagsWithLimitationInterface[] = [
  {
    name: DockerCommandFlagsWithLimitationTypes.TARGET,
    type: 'string',
    argument: 'direct-start',
    useChar: true,
    description: [ 'Target a container directly in docker-compose file.' ]
  },
  {
    name: DockerCommandFlagsWithLimitationTypes.NO_CACHE,
    type: 'boolean',
    argument: 'with-double',
    description: [ 'Use no cache.' ]
  },
  {
    name: DockerCommandFlagsWithLimitationTypes.PULL,
    type: 'boolean',
    argument: 'with-double',
    description: [ 'Always pull fresh image.' ]
  },
  {
    name: DockerCommandFlagsWithLimitationTypes.PARALLEL,
    type: 'boolean',
    argument: 'with-double',
    description: [ 'Run Docker tasks in parallel.' ]
  },
  {
    name: DockerCommandFlagsWithLimitationTypes.FORCE_REMOVE,
    type: 'boolean',
    argument: 'with-double',
    description: [ 'Always remove intermediate containers.' ]
  },
  {
    name: DockerCommandFlagsWithLimitationTypes.REMOVE_ORPHANS,
    type: 'boolean',
    argument: 'with-double',
    description: [ 'Remove containers for services not defined in the compose file.' ]
  },
  {
    name: DockerCommandFlagsWithLimitationTypes.COMMAND,
    type: 'string',
    argument: 'direct-end',
    useChar: true,
    description: [ 'Run a command.' ]
  }
]

export const dockerCommandsAvailable: Record<string, DockerCommandsAvailableInterface> = {
  up: {
    command: 'docker-compose up -d'
  },
  down: {
    command: 'docker-compose down',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.REMOVE_ORPHANS ]
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
    command: 'docker-compose build',
    limitedFlags: [
      DockerCommandFlagsWithLimitationTypes.NO_CACHE,
      DockerCommandFlagsWithLimitationTypes.PULL,
      DockerCommandFlagsWithLimitationTypes.PULL,
      DockerCommandFlagsWithLimitationTypes.PARALLEL,
      DockerCommandFlagsWithLimitationTypes.FORCE_REMOVE
    ]
  },
  ls: {
    command: 'docker-compose config --services',
    keepOutput: true
  },
  ps: {
    command: 'docker-compose ps --all',
    keepOutput: true
  },
  exec: {
    command: 'docker-compose exec',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.TARGET, DockerCommandFlagsWithLimitationTypes.COMMAND ],
    deffered: true,
    headless: true
  }
}

export enum DockerCommandConstants {
  ALL_SERVICES = 'all'
}
