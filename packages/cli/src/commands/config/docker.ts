import { ConfigBaseCommand, ConfigCommandChoices, ConfigRemove, ConfigTypes, createTable, promptUser } from '@cenk1cenk2/boilerplate-oclif'
import globby from 'globby'

import { ServiceConfig, ServicePrompt, ServiceProperties } from '@context/config/services.interface'
import { DockerCommandConstants } from '@interfaces/commands/docker/index.constants'
import { ConfigFileConstants, RegexConstants } from '@interfaces/constants'
import { findFilesInDirectory, findFilesInDirectoryWithServiceConfig } from '@utils/file.util'

export default class ConfigCommand extends ConfigBaseCommand {
  static description = [
    'Edit services that is managed by this CLI.',
    `- Path can be a absolute value or a regular expression in gitignore format seperated by "${RegexConstants.REGEX_SPLITTER}".`,
    '- Name is a alias to group the specific set of services.',
    '- Regular expressions can have a depth to limit their recursive iteration over folders. "0" will disable this limit.'
  ].join('\n')

  public choices = [
    ConfigCommandChoices.show,
    ConfigCommandChoices.add,
    ConfigCommandChoices.edit,
    ConfigCommandChoices.remove,
    ConfigCommandChoices.delete,
    ConfigCommandChoices.import
  ]

  protected configName = ConfigFileConstants.SERVICES_CONFIG
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
          [ 'Name', 'Path', 'File', 'Found Entries' ],
          await Object.values(config).reduce(async (o, entry) => {
            const files = await findFilesInDirectoryWithServiceConfig(entry)

            return [ ...await o, [ entry.name, entry.path.toString(), entry.file.toString(), files.length > 0 ? files.join('\n') : 'No files found.' ] ]
          }, Promise.resolve([]))
        )
      )
      this.logger.module('Configuration file is listed.')
    } else {
      this.logger.warn('Configuration file is empty.')
    }
  }

  public async configRemove (config: ServiceConfig): Promise<ConfigRemove<ServiceConfig>> {
    return {
      keys: Object.keys(config),
      removeFunction: async (config: ServiceConfig, userInput: string[]): Promise<ServiceConfig> => {
        let desiredConfig = config
        userInput.forEach((entry) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
          const { [entry]: omit, ...rest } = desiredConfig
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
      validate: (value: any): Promise<string | boolean> => this.validate(value),
      result: (value: any): Promise<ServiceProperties> => this.result(config, value, id)
    })
  }

  private async validate (response: ServicePrompt, options?: globby.GlobbyOptions, validateOptions?: { log: boolean }): Promise<boolean | string> {
    // assign default options
    validateOptions = {
      log: true,
      ...validateOptions
    }

    if (response.name === DockerCommandConstants.ALL_SERVICES) {
      return `Name of the group can not be same with the reserved name: ${DockerCommandConstants.ALL_SERVICES}`
    }

    const pattern = await findFilesInDirectory(response.path, response.file, options)

    if (pattern.length === 0) {
      return `Can not find any matching files with pattern: ${response.file}@${response.path}`
    }

    if (validateOptions?.log) {
      pattern.forEach((message) => this.message.verbose(`Found pattern: ${message}`))
    }

    return true
  }

  private async result (config: ServiceConfig, prompt: ServicePrompt, id?: string): Promise<ServiceProperties> {
    const response = {} as ServiceProperties
    let abortMission: boolean

    // initiate empty names as their paths
    if (prompt.name === '') {
      this.logger.warn(`Name was empty for service, initiated it as "${prompt.path}".`)

      response.name = prompt.path
    } else {
      response.name = prompt.name
    }

    // if item with given name already exists prompt first
    if (config?.[response?.name] && !id) {
      abortMission = !await promptUser<boolean>({ type: 'Toggle', message: `Name "${response.name}" already exists in local configuration. Do you want to overwrite?` })
    }

    // check if regular expression
    if (globby.hasMagic(prompt.path)) {
      response.path = prompt.path.split(RegexConstants.REGEX_SPLITTER)
      const regex = await promptUser<string>({
        type: 'Input',
        message: 'This looks like a regular expression. Please set a depth to search for docker-compose files:',
        initial: typeof config[id]?.regex === 'number' ? config[id]?.regex === Infinity ? '0' : config[id]?.regex.toString() : '0',
        validate: (value): Promise<boolean | string> | string => {
          if (value === '0') {
            value = Infinity
          } else {
            value = parseInt(value, 10)
          }

          if (!isNaN(value) && value >= 0) {
            return this.validate(prompt, { deep: value }, { log: false })
          }

          return 'Search depth must be a positive number or 0 for disabling.'
        }
      })

      response.regex = regex === '0' ? Infinity : parseInt(regex, 10)
    } else {
      response.path = [ prompt.path ]
      response.regex = false
    }

    response.file = prompt.file.split(RegexConstants.REGEX_SPLITTER)

    // abort mission on certain occasions, and return the prompt on the valid ones
    if (!abortMission) {
      return response
    }
  }
}
