import { ConfigBaseCommand, createTable, IConfigRemove, promptUser } from '@cenk1cenk2/boilerplate-oclif'
import chalk from 'chalk'
import fs from 'fs-extra'
import globby from 'globby'
import { PromptOptions } from 'listr2'

import { ServiceConfig, ServicePrompt, ServiceProperties } from '@context/config/services.interface'

export default class ConfigCommand extends ConfigBaseCommand {
  static description = 'Edit services that is managed by this CLI.'
  protected configName = 'services.servicecmd.yml'
  protected configType: 'general' = 'general'

  async configAdd (config: ServiceConfig): Promise<ServiceConfig> {
    // prompt user for details
    const response = await promptUser<ServiceProperties>(this.prompt(config))

    if (response) {
      config[response?.name] = Object.keys(response).reduce((o, key) => {
        o[key] = response[key]
        return o
      }, {} as ServiceProperties)

      this.logger.success(`Added "${response.name}" to the local configuration.`)
    }

    return config
  }

  async configEdit (config: ServiceConfig): Promise<ServiceConfig> {
    // prompt user for which keys to edit
    const select = await promptUser({
      type: 'AutoComplete',
      message: 'Please select configuration to edit.',
      choices: Object.keys(config)
    })

    const edit = await promptUser(this.prompt(config, select))

    // write to temp
    config[edit.name] = edit
    this.logger.success(`Edited "${select}" with "${edit.name}" in the local configuration.`)

    return config
  }

  public async configShow (config: ServiceConfig): Promise<void> {
    if (Object.keys(config).length > 0) {
      this.logger.info(
        createTable(
          [ 'Name', 'Path' ],
          Object.values(config).reduce((o, entry) => {
            return [ ...o, [ entry.name, entry.path.toString() ] ]
          }, [])
        )
      )
      this.logger.module('Configuration file is listed.')

    } else {
      this.logger.warn('Configuration file is empty.')

    }
  }

  public async configRemove (config: ServiceConfig): Promise<IConfigRemove<ServiceConfig>> {
    return {
      keys: Object.keys(config),
      removeFunction: async (config: ServiceConfig, userInput: string[]): Promise<ServiceConfig> => {
        let desiredConfig: ServiceConfig
        userInput.forEach((entry) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
          const { [entry]: omit, ...rest } = config
          desiredConfig = rest
        })

        return desiredConfig
      }
    }
  }

  private prompt (config: ServiceConfig, id?: string): PromptOptions {
    return {
      type: 'Form',
      message: 'Please provide the details for service.',
      choices: [
        {
          name: 'path',
          message: 'Path',
          initial: id ? config[id].path.join(':') : '',
          required: true
        },
        {
          name: 'name',
          message: 'Name',
          initial: id ? config[id].name : ''
        }
      ],
      footer: chalk.italic.dim(
        // eslint-disable-next-line max-len
        'Path can be a absolute value, relative to default directory or a regular expression. Regular expressions can be in gitignore format seperated by colons. Name is a alias to call services from the CLI directly. Elsewise it will be defaulting to the path.'
      ),
      validate: (value: any): Promise<string | boolean> => this.validate(config, value),
      result: (value: any): Promise<ServiceProperties> => this.result(config, value)
    }
  }

  private async validate (config: ServiceConfig, response: ServicePrompt): Promise<boolean | string> {
    if (globby.hasMagic(response.path)) {
      const test = await globby(response.path.split(':'))
      test.forEach((message) => this.message.info(message))
    }

    return true
  }

  private async result (config: ServiceConfig, prompt: ServicePrompt): Promise<ServiceProperties> {
    const response = {} as ServiceProperties

    // initiate empty names as their paths
    if (prompt.name === '') {
      this.logger.warn(`Name was empty for service, initiated it as "${prompt.path}".`)

      response.name = prompt.path
    } else {
      response.name = prompt.name
    }

    // if item with given name already exists prompt first
    let overwritePrompt: boolean
    if (config?.[response?.name]) {
      overwritePrompt = await promptUser<boolean>({ type: 'Toggle', message: `Name "${response.name}" already exists in local configuration. Do you want to overwrite?` })
    }

    // check if regular expression
    if (new RegExp(/[!*?{}]/g).test(prompt.path)) {
      response.path = prompt.path.split(':')
      response.regex = parseInt(
        await promptUser<string>({
          type: 'Input',
          message: 'This looks like a regular expression. Please set a depth to search for docker-compose files:',
          initial: '1',
          validate: (value): boolean | string => {
            if (parseInt(value, 10) && parseInt(value, 10) > 0) {
              return true
            } else {
              return 'Search depth must be a positive number.'
            }
          }
        }),
        10
      )
    } else {
      response.path = [ prompt.path ]
      response.regex = false
    }

    // abort mission on certain occasions, and return the prompt on the valid ones
    if (overwritePrompt ?? true) {
      return response
    } else {
      return
    }
  }
}
