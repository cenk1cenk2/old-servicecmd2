import Command from './base.command'
import { Locker } from '@extend/locker'
import { ObjectLiteral } from '@interfaces/object-literal.interface'
import { createTable, mergeObjects } from '@utils/custom.util'
import { checkExists, deleteFile, readFile } from '@utils/file-tools.util'
import { promptUser } from '@utils/prompt.util'

export default abstract class extends Command {
  protected configLock: Locker = new Locker(this.id, 'local')
  protected abstract configName: string
  protected abstract configType: 'general' | 'local'

  public async run (): Promise<void> {
    await this.generateConfigurationMenu()
  }

  private async generateConfigurationMenu (): Promise<void> {
    // handle choices for different config types
    let choices: string[]

    if (this.configType === 'general') {
      choices = [ 'Show', 'Add', 'Remove', 'Edit', 'Init', 'Import', 'Delete' ]
    } else if (this.configType === 'local') {
      choices = [ 'Show', 'Add', 'Remove', 'Edit', 'Import', 'Delete' ]
    } else {
      this.logger.critical('Config type to edit is wrong this should not have happened.')
      process.exit(126)
    }

    // prompt user for the action
    const response: string = await promptUser('Select', {
      message: 'What do you want to do with the skeleton config?',
      choices
    })

    if (this[`${response.toLowerCase()}Config`]) {
      this[`${response.toLowerCase()}Config`]()
    } else {
      this.logger.critical('This should not have happened in config command! No valid function to execute.')
    }
  }

  // @ts-ignore
  private async addConfig (): Promise<void> {
    const { config } = await this.getConfig(this.configName)

    const desiredConfig = await this.configAdd(config)

    if (this.configType === 'general') {
      await this.resetConfig(this.configName, desiredConfig)
    } else if (this.configType === 'local') {
      await this.configLock.lock([ { data: desiredConfig, merge: true } ])
    }

    this.logger.module('New configurations added to the file.')
  }

  // @ts-ignore
  private async editConfig (): Promise<void> {
    const { config } = await this.getConfig(this.configName)

    if (Object.keys(config).length === 0) {
      this.logger.fail('No entries inside the config file.')
      return
    }
    const editedConfig = await this.configEdit(config)

    if (this.configType === 'general') {
      await this.resetConfig(this.configName, editedConfig)
    } else if (this.configType === 'local') {
      await this.configLock.lock([ { data: editedConfig } ])
    }

    this.logger.module('Editted config file.')
  }

  // @ts-ignore
  private async removeConfig (): Promise<void> {
    // write configuration to file merge with existing one
    const { local, config } = await this.getConfig(this.configName)
    let desiredConfig = config

    // if does not have local config
    if (!local && this.configType === 'general') {
      this.logger.fail('No local configuration file found, please initiate it first.')
      return
    }

    // check entry count in the config file
    if (Object.keys(config).length === 0) {
      this.logger.fail('No entries inside the config file.')
      return
    }

    // get prompts for which one to remote
    const userInput: string[] = await promptUser('MultiSelect', {
      message: 'Please select configuration to delete. [space to select, a to select all]',
      choices: Object.keys(config)
    })

    // if nothing selected in the prompt
    if (userInput.length === 0) {
      this.logger.warn('Nothing selected to remove.')
      return
    }

    userInput.forEach((entry) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
      const { [entry]: omit, ...rest } = desiredConfig
      desiredConfig = rest
    })

    // write file
    if (this.configType === 'general') {
      await this.resetConfig(this.configName, desiredConfig)
    } else if (this.configType === 'local') {
      await this.configLock.lock([ { data: desiredConfig } ])
    }
    this.logger.module(`Removed entries "${userInput.toString()}" from local config file.`)
  }

  // @ts-ignore
  private async showConfig (): Promise<void> {
    // get configuration file
    const { local, config } = await this.getConfig(this.configName)

    if (this.configType === 'general') {
      this.logger.info(`Current configuration file is "${local ? 'local' : 'from module'}".`)

      if (!local) {
        this.logger.warn('Use add to start with predefined local configuration or reset to start with empty local configuration that is editable through menu.')
      }
    }

    if (Object.keys(config).length > 0) {
      this.logger.info(createTable([ 'Entry', 'Value' ], Object.entries(config)))
    } else {
      this.logger.warn('Configuration file is empty.')
    }

    this.logger.module('Configuration file is listed.')
  }

  // @ts-ignore
  private async importConfig (): Promise<void> {
    const userInput: { importPath?: string, merge?: boolean } = {}
    userInput.importPath = await promptUser('Input', { message: 'Enter the path you want to import from:' })

    if (!checkExists(userInput.importPath)) {
      this.logger.fail(`Import file can not be found at path "${userInput.importPath}".`)
      process.exit(21)
    }

    const { local, config } = await this.getConfig(this.configName)

    if (local && Object.keys(config)?.length > 0) {
      userInput.merge = await promptUser('Toggle', {
        message: 'Do you want to merge with the current configuration file?',
        enabled: 'Merge',
        disabled: 'Import directly'
      })
    }

    const importFile = await readFile(userInput.importPath)

    let desiredConfig: ObjectLiteral
    if (userInput.merge) {
      desiredConfig = mergeObjects(config, importFile)
    } else {
      desiredConfig = importFile
    }

    if (this.configType === 'general') {
      await this.resetConfig(this.configName, desiredConfig)
    } else if (this.configType === 'local') {
      await this.configLock.lock([ { data: desiredConfig } ])
    }
    this.logger.module(`Imported configuration file from "${userInput.importPath}".`)
  }

  // @ts-ignore
  private async deleteConfig (): Promise<void> {
    let path: string

    if (this.configType === 'general') {
      ({ path } = await this.getConfig(this.configName))
    } else if (this.configType === 'local') {
      path = this.configLock.getLockPath()
    }

    if (!path) {
      this.logger.warn('No local configuration file found.')
      return
    }

    await deleteFile(path)
    this.logger.module(`Deleted local config file at "${path}".`)
  }

  // @ts-ignore
  private async initConfig (): Promise<void> {
    if (this.configType === 'general') {
      await this.resetConfig(this.configName)
    }
  }

  // @review: configFileType
  abstract configAdd(configFile: ObjectLiteral): Promise<ObjectLiteral>

  abstract configEdit(configFile: ObjectLiteral): Promise<ObjectLiteral>
}
