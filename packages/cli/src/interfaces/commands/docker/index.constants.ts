import { DockerCommandFlagsWithLimitationInterface, DockerCommandsAvailableInterface } from './index.interface'

export enum DockerCommandFlagsWithLimitationTypes {
  TARGET = 'target',
  NO_CACHE = 'no-cache',
  PULL = 'pull',
  PARALLEL = 'parallel',
  FORCE_REMOVE = 'force-rm',
  REMOVE_ORPHANS = 'remove-orphans',
  ARGUMENTS = 'args',
  RMI = 'rmi',
  PRIVILEGED = 'privileged'
}

export const dockerCommandFlagsWithLimitation: DockerCommandFlagsWithLimitationInterface[] = [
  {
    name: DockerCommandFlagsWithLimitationTypes.TARGET,
    type: 'string',
    argument: 'value-start',
    useChar: true,
    description: [ 'Target a container directly in docker-compose file.' ]
  },
  {
    name: DockerCommandFlagsWithLimitationTypes.ARGUMENTS,
    type: 'string',
    argument: 'value-end',
    useChar: true,
    description: [ 'Always adds this as the last argument.' ]
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
    name: DockerCommandFlagsWithLimitationTypes.RMI,
    type: 'string',
    argument: 'with-double',
    description: [ 'Remove containers for services not defined in the compose file.' ],
    options: {
      options: [ 'all', 'local' ]
    }
  },
  {
    name: DockerCommandFlagsWithLimitationTypes.PRIVILEGED,
    type: 'boolean',
    argument: 'with-double',
    description: [ 'Give extended privileges to the process.' ]
  }
]

export const dockerCommandsAvailable: Record<string, DockerCommandsAvailableInterface> = {
  up: {
    command: 'docker-compose up -d',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.ARGUMENTS, DockerCommandFlagsWithLimitationTypes.REMOVE_ORPHANS ]
  },
  down: {
    command: 'docker-compose down',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.ARGUMENTS, DockerCommandFlagsWithLimitationTypes.REMOVE_ORPHANS, DockerCommandFlagsWithLimitationTypes.RMI ]
  },
  restart: {
    command: 'docker-compose restart',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.ARGUMENTS ]
  },
  logs: {
    command: 'docker-compose logs -f',
    deffered: true,
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.ARGUMENTS, DockerCommandFlagsWithLimitationTypes.TARGET ]
  },
  kill: {
    command: 'docker-compose kill',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.ARGUMENTS, DockerCommandFlagsWithLimitationTypes.TARGET ],
    requireFlags: [ DockerCommandFlagsWithLimitationTypes.TARGET ]
  },
  stop: {
    command: 'docker-compose stop',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.ARGUMENTS, DockerCommandFlagsWithLimitationTypes.TARGET ]
  },
  exec: {
    command: 'docker-compose exec',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.TARGET, DockerCommandFlagsWithLimitationTypes.ARGUMENTS, DockerCommandFlagsWithLimitationTypes.PRIVILEGED ],
    requireFlags: [ DockerCommandFlagsWithLimitationTypes.TARGET, DockerCommandFlagsWithLimitationTypes.ARGUMENTS ],
    limits: {
      services: 1
    },
    deffered: true,
    headless: true
  },
  pull: {
    command: 'docker-compose pull',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.ARGUMENTS ]
  },
  build: {
    command: 'docker-compose build',
    limitedFlags: [
      DockerCommandFlagsWithLimitationTypes.ARGUMENTS,
      DockerCommandFlagsWithLimitationTypes.NO_CACHE,
      DockerCommandFlagsWithLimitationTypes.PULL,
      DockerCommandFlagsWithLimitationTypes.PARALLEL,
      DockerCommandFlagsWithLimitationTypes.FORCE_REMOVE
    ]
  },
  ls: {
    command: 'docker-compose config --services',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.ARGUMENTS ],
    keepOutput: true
  },
  ps: {
    command: 'docker-compose ps --all',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.ARGUMENTS ],
    keepOutput: true
  },
  rm: {
    command: 'docker-compose rm --force --stop',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.ARGUMENTS ]
  },
  top: {
    command: 'docker-compose top',
    limitedFlags: [ DockerCommandFlagsWithLimitationTypes.ARGUMENTS ],
    keepOutput: true
  },
  stats: {
    command: 'SERVICES=$(docker-compose ps -q) && [ ! -z "$SERVICES" ] && docker stats --no-stream $SERVICES || echo "No running services has been found."',
    keepOutput: true
  }
}

export enum DockerCommandConstants {
  ALL_SERVICES = 'all'
}
