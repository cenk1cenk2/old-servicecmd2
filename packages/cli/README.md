@cenk1cenk2/oclif-boilerplate
========

# Description

An empty and extended oclif boilerplate.

# Navigation

<!-- toc -->
* [Description](#description)
* [Navigation](#navigation)
* [Further Development](#further-development)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Further Development
For further development you can clone this repository.

While developing you must use `export TS_NODE=1` environment variable, since I did not want to directly extend OCLIF's classes for detecting TS-Node.

`--debug` enables verbose mode, while `--inspect` creates a new inspector.

# Usage

<!-- usage -->
```sh-session
$ npm install -g @servicecmd/cli
$ cenk1cenk2 COMMAND
running command...
$ cenk1cenk2 (-v|--version|version)
@servicecmd/cli/0.0.1 linux-x64 node-v14.4.0
$ cenk1cenk2 --help [COMMAND]
USAGE
  $ cenk1cenk2 COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`cenk1cenk2 config:services`](#cenk1cenk2-configservices)
* [`cenk1cenk2 docker [COMMAND]`](#cenk1cenk2-docker-command)
* [`cenk1cenk2 help [COMMAND]`](#cenk1cenk2-help-command)

## `cenk1cenk2 config:services`

Edit services that is managed by this CLI.

```
USAGE
  $ cenk1cenk2 config:services
```

_See code: [dist/commands/config/services.ts](https://github.com/cenk1cenk2/servicecmd/blob/v0.0.1/dist/commands/config/services.ts)_

## `cenk1cenk2 docker [COMMAND]`

describe the command here

```
USAGE
  $ cenk1cenk2 docker [COMMAND]

ARGUMENTS
  COMMAND  (start|stop) asd

OPTIONS
  -f, --force
  -h, --help   show CLI help
```

_See code: [dist/commands/docker/index.ts](https://github.com/cenk1cenk2/servicecmd/blob/v0.0.1/dist/commands/docker/index.ts)_

## `cenk1cenk2 help [COMMAND]`

display help for cenk1cenk2

```
USAGE
  $ cenk1cenk2 help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.1.0/src/commands/help.ts)_
<!-- commandsstop -->
