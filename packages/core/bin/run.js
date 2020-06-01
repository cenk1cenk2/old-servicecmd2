#!/usr/bin/env node

// eslint-disable-next-line import/order
const inspector = require('inspector')
// eslint-disable-next-line import/order
const path = require('path')

// overwrite debug and silent logger and listr through config
const debug = process.argv.indexOf('--debug')
const silent = process.argv.indexOf('--silent')
const inspect = process.argv.indexOf('--inspect')

// debug port
if (inspect !== -1 || debug !== -1) {
  inspector.open()
  if (inspect !== -1) process.argv.splice(inspect, 1)
}

// log levels, with single variable instead of the config plugin
if (debug !== -1) {
  process.env.NODE_ENV = 'debug'
  process.argv.splice(debug, 1)
}
if (silent !== -1) {
  process.env.NODE_ENV = 'silent'
  process.argv.splice(silent, 1)
}

// typescript paths register on development
if (process.env.TS_NODE === '1') {
  const tsConfigPaths = require('tsconfig-paths')

  const tsConfig = require('../tsconfig.json')

  tsConfigPaths.register({
    baseUrl: path.join(path.dirname(require.main.filename), `../${tsConfig.compilerOptions.baseUrl}`),
    paths: tsConfig.compilerOptions.paths
  })
}

// initiate config directory for npm plugin config
// config module jumps on top of anything so we have to initate it before running
process.env.NODE_CONFIG_DIR = path.join(path.dirname(require.main.filename), '../config')

require('@oclif/command').run()
  .then(require('@oclif/command/flush'))
  .catch(require('@oclif/errors/handle'))
