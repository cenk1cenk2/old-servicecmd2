# @servicecmd/cli

[![Build Status](https://drone.kilic.dev/api/badges/cenk1cenk2/servicecmd/status.svg)](https://drone.kilic.dev/cenk1cenk2/servicecmd) [![Version](https://img.shields.io/npm/v/@servicecmd/cli.svg)](https://npmjs.org/package/@servicecmd/cli) [![Downloads/week](https://img.shields.io/npm/dw/@servicecmd/cli.svg)](https://npmjs.org/package/@servicecmd/cli) [![Dependencies](https://img.shields.io/librariesio/release/npm/@servicecmd/cli)](https://npmjs.org/package/@servicecmd/cli) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

- [Changelog](./CHANGELOG.md)
  <!-- toc -->

* [@servicecmd/cli](#servicecmdcli)
* [Description](#description)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Description

This is the base of the @servicecmd. All other features will extend the capabilities of the default CLI.

This CLI enables the user to proxy commands to multiple docker-compose stacks.

# Initial Setup

- [Adding a new configuration](#Adding-a-new-configuration)

## Usage

### Proxying Commands to Groups

- Run [`servicecmd docker`](#servicecmd-docker) with flags.

There is important flags you want to keep an eye on.

#### Run [-r] [--run]

- Will run a certain command for the set of services.

  These commands coincide withs the naming scheme of docker-compose cli and can be:

  - up
  - down
  - restart
  - logs
  - kill
  - stop
  - exec
  - pull
  - build
  - ls -> shows the services inside docker-compose stack
  - ps
  - rm
  - top
  - stats -> filters docker stats with the containers specified

- Some of these commands have their unique flags required but the CLI will throw out an error requesting them if it is missing.
- Some of these commands also have their specific flags which it will pass them to the docker-compose CLI.
- I have used flags instead of positional arguments since I sometimes prefer to add the command to end and change it on different runs and sometimes I prefer to add the command to the beginning and change the other parameters.

##### Examples

- Run a command `servicecmd docker -r up`

#### Group [-g] [--group]

- Will limit the task to certain group which is the designated name while defining the set of docker-compose stacks in `servicecmd config docker`.
- Can be multiple for running the command in multiple groups.
- Will default to `all` which will run for all services defined in the configuration file.

##### Examples

- Run for all groups: `servicecmd docker ...`
- Run for specific group: `servicecmd docker -g some-other-group ...`
- Run for multiple specific groups: `servicecmd docker -g some-group -g some-other-group ...`

#### Limit [-l] [--limit]

- Will filter the services depending on their absolute path after all the regular expressions in the configuration has been evaluated.

  Example for your configuration of group:

  `{ path: '/docker/**', depth: 0 }`

  Where you have services after being evaluated:

  ```
  /docker/service1/docker-compose.yml
  /docker/service2/docker-compose.yml
  /docker/service3/docker-compose.yml
  /docker/other/docker-compose.yml
  ```

  Limit is essentially a JavaScript regular expression so

  - `-l "service.?"` or `-l service` will resolve to all 3 services with name service on them.
  - `-l service3` will resolve to only service3.

- Can be multiple arguments.

##### Examples

- Run for a single service: `servicecmd docker -l service/`
- Run for multiple service with regular expressions: `servicecmd docker -l "service.?/"`
- Run for multiple services imperatively: `servicecmd doker -l service1/ -l service2/ -l service3/`

#### Ignore [-i] [--ignore]

- Ignore is the same with limit flag but the other way around limitting the services that should be run.
- Ignore will run after every service is parsed so it also takes in hand your group and limit flags.

##### Examples

- Run for everything except a single service: `servicecmd docker -i service/`
- Run for everything except multiple service with regular expressions: `servicecmd docker -i "service.?/"`
- Run for everything except multiple services imperatively: `servicecmd doker -i service1/ -i service2/ -l service3/`

#### Prompt [-p] [--prompt]

- This will parse the command and create a yes/no prompt with what command it will apply to and for which targets.

#### Target [-t] [--target]

- For some commands you can target the container name directly.
- The argument might be required depending on the run command.
- This is a docker-compose specific argument which only works for given set of run commands. `servicecmd docker --help` will list the commands it works with.

##### Examples

- Run logs for only single container named `mysql` in your docker-compose stack that resides in `/docker/some-container`: `servicecmd docker -l some-container -t mysql -r logs`

#### Args [-a] [--args]

- You can add any argument and this flag will append it to the end of the command.
- The argument might be required depending on the run command.
- This is a docker-compose specific argument which only works for given set of run commands. `servicecmd docker --help` will list the commands it works with.

##### Examples

- Drop in to bash session of container named `mysql` in your docker-compose stack that resides in `/docker/some-container`: `servicecmd docker -l some-container -t mysql -r exec -a bash`
- Add `abort-on-container-exit` flag to up run command: `servicecmd docker -l some-container -r up -a "--abort-on-container-exit"`

#### Docker-Compose Specific Arguments

- Some of the docker-compose arguments have their proxy in this CLI to have easy access.
- Certain arguments work with certain run commands. [`servicecmd docker --help`](#servicecmd-docker) will list the commands it works with.

### Configuration Files

- Configuration files are in `yml` format to make it easier to manage it with automation tools like Ansible, Puppet or Chef.
- Configuration files are stored in the `${HOME}/.config/servicecmd` folder.

### Adding a new configuration

- Run [`servicecmd config docker`](#servicecmd-config:docker).
- An interactive prompt will appear. Select "add" option.
- Fill the generated prompt.

  - Path is the option where you define the service root.

    The service root can be:

    - Absolute folder of the docker-compose stack.
    - Single or multiple regular expressions in gitignore format. Multiple expressions should be seperated by ":".

      Regular expressions will also prompt for the depth that it should search for files. The default is 1 which is directly that folder. But you can designate it as 0 to disable this limit or throw in a integer value to limit the depth.

  - Name will be the alias of the designated group where it is used to address it in other command. It will default to the folder name itself.

  - File can be multiple expressions seperated by ":". If you want to run other named docker-compose files like "docker-compose.production.yml" it will be useful for that. Defaults to "docker-compose.yml".

### Managing an existing configuration

- Run [`servicecmd config docker`](#servicecmd-config:docker).
- The interactive menu will appear with certain set of tasks.

| Command | Description                                           |
| ------- | ----------------------------------------------------- |
| Show    | Show the current configuration.                       |
| Add     | Will add a new group to the current configuration.    |
| Edit    | Edit an existing entry.                               |
| Remove  | Remove one or more entries in the configuration file. |
| Delete  | Delete the local configuration file compeletely.      |
| Import  | Import a configuration from a local file or HTTP.     |

# Install

<!-- usage -->

```sh-session
$ npm install -g @servicecmd/cli
$ servicecmd COMMAND


running command...
$ servicecmd (-v|--version|version)
@servicecmd/cli/1.0.0 linux-x64 node-v14.8.0
$ servicecmd --help [COMMAND]
USAGE
  $ servicecmd COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`servicecmd autocomplete [SHELL]`](#servicecmd-autocomplete-shell)
- [`servicecmd config`](#servicecmd-config)
- [`servicecmd config:docker`](#servicecmd-configdocker)
- [`servicecmd docker`](#servicecmd-docker)
- [`servicecmd help [COMMAND]`](#servicecmd-help-command)

## `servicecmd autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ servicecmd autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ servicecmd autocomplete
  $ servicecmd autocomplete bash
  $ servicecmd autocomplete zsh
  $ servicecmd autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.2.0/src/commands/autocomplete/index.ts)_

## `servicecmd config`

Manipulate the configuration options for this CLI.

```
USAGE
  $ servicecmd config
```

_See code: [dist/commands/config/index.ts](https://github.com/cenk1cenk2/servicecmd/blob/v1.0.0/dist/commands/config/index.ts)_

## `servicecmd config:docker`

Edit services that is managed by this CLI.

```
USAGE
  $ servicecmd config:docker

DESCRIPTION
  - Path can be a absolute value or a regular expression in gitignore format seperated by ":".
  - Name is a alias to group the specific set of services.
  - Regular expressions can have a depth to limit their recursive iteration over folders. "0" will disable this limit.
```

_See code: [dist/commands/config/docker.ts](https://github.com/cenk1cenk2/servicecmd/blob/v1.0.0/dist/commands/config/docker.ts)_

## `servicecmd docker`

Runs the designated command over the the intended services.

```
USAGE
  $ servicecmd docker

OPTIONS
  -a, --args=args                                                              Always adds this as the last argument.
                                                                               Works with commands: "exec"

  -g, --group=group                                                            [default: all] Limit the task with
                                                                               service group name.

  -i, --ignore=ignore                                                          Ignore a service utilizing JavaScript
                                                                               regex pattern depending on the final
                                                                               folder location.

  -l, --limit=limit                                                            Limit a service utilizing JavaScript
                                                                               regex pattern depending on the final
                                                                               folder location.

  -p, --prompt                                                                 Prompt user before doing something.

  -r, --run=up|down|logs|pull|build|ls|ps|exec|kill|restart|rm|top|stats|stop  (required) Execute the given command.

  -t, --target=target                                                          Target a container directly in
                                                                               docker-compose file. Works with commands:
                                                                               "logs, exec, kill, stop"

  --force-rm                                                                   Always remove intermediate containers.
                                                                               Works with commands: "build"

  --no-cache                                                                   Use no cache. Works with commands:
                                                                               "build"

  --parallel                                                                   Run Docker tasks in parallel. Works with
                                                                               commands: "build"

  --privileged                                                                 Give extended privileges to the process.
                                                                               Works with commands: "exec"

  --pull                                                                       Always pull fresh image. Works with
                                                                               commands: "build"

  --remove-orphans                                                             Remove containers for services not
                                                                               defined in the compose file. Works with
                                                                               commands: "down"

  --rmi=all|local                                                              Remove containers for services not
                                                                               defined in the compose file. Works with
                                                                               commands: "down"

EXAMPLE
  ┌────────────────────┬─────────────┐
  │ To Achieve         │ Run Command │
  ├────────────────────┼─────────────┤
  │ run ceration tasks │ asd         │
  └────────────────────┴─────────────┘
```

_See code: [dist/commands/docker/index.ts](https://github.com/cenk1cenk2/servicecmd/blob/v1.0.0/dist/commands/docker/index.ts)_

## `servicecmd help [COMMAND]`

display help for servicecmd

```
USAGE
  $ servicecmd help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src/commands/help.ts)_

<!-- commandsstop -->
