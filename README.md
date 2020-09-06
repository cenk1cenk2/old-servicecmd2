# servicecmd

A set of Node.js CLI tools that enables the users to manage and monitor multiple docker-compose stacks by grouping them in to folders and ability to filter them.

<!-- toc -->
<!-- tocstop -->

# Base Package

## [@servicecmd/cli](./packages/cli/README.md)

[![Build Status](https://drone.kilic.dev/api/badges/cenk1cenk2/servicecmd/status.svg)](https://drone.kilic.dev/cenk1cenk2/servicecmd) [![Version](https://img.shields.io/npm/v/@servicecmd/cli.svg)](https://npmjs.org/package/@servicecmd/cli) [![Downloads/week](https://img.shields.io/npm/dw/@servicecmd/cli.svg)](https://npmjs.org/package/@servicecmd/cli) [![Dependencies](https://img.shields.io/librariesio/release/npm/@servicecmd/cli)](https://npmjs.org/package/@servicecmd/cli) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

![Demo](./media/demo_servicecmd-cli.gif)

This is the base of the @servicecmd. All other features will extend the capabilities of the default CLI.

This CLI enables the user to proxy commands to multiple docker-compose stacks.

# Plugins

## [@servicecmd/daemon](./packages/daemon/README.md)

> **WIP**

Will extend the default cli to have daemon capabilities that will connect to the message queue and monitored through the frontend/backend application.

## [@servicecmd/frontend](./packages/frontend/README.md)

> **WIP**

Will add a frontend to control/monitor multiple servers from the same place.

## [@servicecmd/backend](./packages/backend/README.md)

> **WIP**

Will add a backend to control/monitor multiple servers from the same place.
