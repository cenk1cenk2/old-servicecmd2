import { ConfigBaseCommand, ConfigRemove, ConfigTypes, createTable, promptUser } from '@cenk1cenk2/boilerplate-oclif'
import globby from 'globby'
import { PromptOptions } from 'listr2'

import { parseFileNamesInDirectory } from '../../utils/file.util'
import { ServiceConfig, ServicePrompt, ServiceProperties } from '@context/config/services.interface'
import { RegexConstants } from '@interfaces/regex.constants'

export default class ConfigCommand extends ConfigBaseCommand {
  static description = [
    'Edit services that is managed by this CLI.',
    '- Path can be a absolute value, relative to default directory or a regular expression.',
    `- Regular expressions can be in gitignore format seperated by '${RegexConstants.REGEX_SPLITTER}'.`,
    '- Name is a alias to call services from the CLI directly.'
  ].join('\n')

  protected configName = 'services.servicecmd.yml'
  protected configType = ConfigTypes.general

  async configAdd (config: ServiceConfig): Promise<ServiceConfig> {
    // prompt user for details
    const response = await this.prompt(config)

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

    const edit = await this.prompt(config, select)

    // write to temp
    config[edit.name] = edit
    this.logger.success(`Edited "${select}" with "${edit.name}" in the local configuration.`)

    return config
  }

  public async configShow (config: ServiceConfig): Promise<void> {
    if (Object.keys(config).length > 0) {
      this.logger.direct(
        createTable(
          [ 'Name', 'Path', 'File' ],
          Object.values(config).reduce((o, entry) => {
            return [ ...o, [ entry.name, entry.path.toString(), entry.file.toString() ] ]
          }, [])
        )
      )
      this.logger.module('Configuration file is listed.')
    } else {
      this.logger.warn('Configuration file is empty.')
    }
    this.logger.module('Bravo')
  }

  public async configRemove (config: ServiceConfig): Promise<ConfigRemove<ServiceConfig>> {
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

  private prompt (config: ServiceConfig, id?: string): Promise<ServiceProperties> {
    return promptUser({
      type: 'Form',
      message: 'Please provide the details for service.',
      choices: [
        {
          name: 'path',
          message: 'Path',
          initial: id ? config[id].path.join(RegexConstants.REGEX_SPLITTER) : '',
          required: true
        },
        {
          name: 'name',
          message: 'Name',
          initial: id ? config[id].name : ''
        },
        {
          name: 'file',
          message: 'File',
          initial: id ? config[id].file.join(RegexConstants.REGEX_SPLITTER) : 'docker-compose.yml'
        }
      ],
      validate: (value: any): Promise<string | boolean> => this.validate(config, value),
      result: (value: any): Promise<ServiceProperties> => this.result(config, value, id)
    })
  }

  private async validate (config: ServiceConfig, response: ServicePrompt): Promise<boolean | string> {
    const pattern = await globby(parseFileNamesInDirectory(response.path, response.file))

    if (pattern.length === 0) {
      return `Can not find any matching files with pattern: ${response.file}@${response.path}`
    }

    pattern.forEach((message) => this.message.verbose(`Found pattern: ${message}`))

    return true
  }

  private async result (config: ServiceConfig, prompt: ServicePrompt, id?: string): Promise<ServiceProperties> {
    const response = {} as ServiceProperties

    // initiate empty names as their paths
    if (prompt.name === '') {
      this.logger.warn(`Name was empty for service, initiated it as "${prompt.path}".`)

      response.name = prompt.path
    } else {
      response.name = prompt.name
    }

    // if item with given name already exists prompt first
    let overwritePrompt = true
    if (config?.[response?.name] && !id) {
      overwritePrompt = await promptUser<boolean>({ type: 'Toggle', message: `Name "${response.name}" already exists in local configuration. Do you want to overwrite?` })
    }

    // check if regular expression
    if (globby.hasMagic(prompt.path)) {
      response.path = prompt.path.split(RegexConstants.REGEX_SPLITTER)
      response.regex = parseInt(
        await promptUser<string>({
          type: 'Input',
          message: 'This looks like a regular expression. Please set a depth to search for docker-compose files:',
          initial: typeof config[id].regex === 'number' ? config[id].regex.toString() : '1',
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

    response.file = prompt.file.split(RegexConstants.REGEX_SPLITTER)

    // abort mission on certain occasions, and return the prompt on the valid ones
    if (overwritePrompt) {
      return response
    } else {
      return
    }
  }
}
