import config from 'config'
import objectPath from 'object-path'

import { ILockData, IUnlockData } from './locker.interface'
import { Logger } from '@extend/logger'
import { ILockFile } from '@interfaces/lock-file.interface'
import { ILogger } from '@interfaces/logger.interface'
import { ObjectLiteral } from '@interfaces/object-literal.interface'
import { mergeObjects } from '@utils/custom.util'
import { checkExists, readFile, writeFile } from '@utils/file-tools.util'

export class Locker {
  private toLock: ILockData[] = []
  private toUnlock: IUnlockData[] = []
  private logger: ILogger

  constructor (private module: string, private type: 'lock' | 'local' = 'lock') {
    this.module = module
    this.logger = Logger.prototype.getInstance(this.constructor.name)
  }

  public async lock (data: ILockData | ILockData[]): Promise<void> {
    // cast to array
    if (!Array.isArray(data)) {
      data = [ data ]
    }

    const currentLock = await this.getLockFile() || {}

    await Promise.all(
      data.map(async (lock) => {
        let lockPath: string

        // you can designate using the module from root instead of this.module
        if (lock?.root !== true) {
          lockPath = lock?.path ? `${this.module}.${lock.path}` : this.module
        } else {
          lockPath = lock.path
        }

        // enabled flag for not if checkking everytime
        if (lock?.enabled === false) {
          return
        }

        // check if data is empty
        if (!lock?.data || Array.isArray(lock?.data) && lock.data.length === 0 || Object?.keys?.length === 0) {
          return
        }

        // set lock
        if (lock?.merge === true) {
          let parsedLockData: [] | ObjectLiteral

          // check if array else merge as object
          if (Array.isArray(lock?.data)) {
            const arrayLock = objectPath.get(currentLock, lockPath) || []
            parsedLockData = [ ...arrayLock, ...lock.data ]
          } else if (typeof lock.data === 'object') {
            parsedLockData = mergeObjects(objectPath.get(currentLock, lockPath) || {}, lock.data)
          } else {
            this.logger.debug(`"${typeof lock.data}" is not mergable.`)
            parsedLockData = [ lock.data ]
          }

          // set lock data
          objectPath.set(currentLock, lockPath, parsedLockData)
          this.logger.debug(`Merge lock: "${lockPath}"`)
        } else {
          // dont merge directly set the data
          objectPath.set(currentLock, lockPath, lock.data)
          this.logger.debug(`Override lock: "${lockPath}"`)
        }
      })
    )

    // write data
    await this.writeLockFile(currentLock)
  }

  public add (data: ILockData | ILockData[]): void {
    if (Array.isArray(data)) {
      this.toLock = [ ...this.toLock, ...data ]
    } else {
      this.toLock = [ ...this.toLock, data ]
    }
  }

  public addUnlock (data?: IUnlockData | IUnlockData[]): void {
    if (Array.isArray(data)) {
      this.toUnlock = [ ...this.toUnlock, ...data ]
    } else {
      this.toUnlock = [ ...this.toUnlock, data ]
    }
  }

  public async lockAll (): Promise<void> {
    await this.lock(this.toLock)
    this.toLock = []
  }

  public async unlock (data?: IUnlockData | IUnlockData[]): Promise<void> {
    // cast to array
    if (data && !Array.isArray(data)) {
      data = [ data ]
    }

    // get lock file
    const currentLock = await this.getLockFile()

    // write data
    if (!currentLock) {
      this.logger.debug('Lock file not found. Nothing to unlock.')
      return
    }

    // option to delete all, or specific locks
    if (Array.isArray(data) && data.length > 0) {
      await Promise.all(
        data.map(async (lock) => {
          let lockPath: string

          if (lock?.root !== true) {
            lockPath = `${this.module}.${lock.path}`
          } else {
            lockPath = lock.path
          }

          // enabled flag for not if checkking everytime
          if (lock?.enabled === false) {
            return
          }

          // set unlock
          objectPath.del(currentLock, lockPath)
          this.logger.debug(`Unlocked: ${lockPath}`)
        })
      )
    } else {
      objectPath.del(currentLock, this.module)
      this.logger.debug(`Unlocked module: ${this.module}`)
    }

    // write data
    await this.writeLockFile(currentLock)
  }

  public async unlockAll (): Promise<void> {
    await this.unlock(this.toUnlock)
    this.toUnlock = []
  }

  public getLockPath (): string {
    // maybe will use it in multiple places, so better keep it here
    if (this.type === 'lock') {
      return config.get('lock')
    } else if (this.type === 'local') {
      return config.get('localConfig')
    } else {
      this.logger.critical('Lock type is not correct. This should not happenned.')
      process.exit(126)
    }
  }

  public async getLockFile (): Promise<ILockFile> {
    const lockPath = this.getLockPath()

    // if not exists
    if (checkExists(lockPath)) {
      return readFile(lockPath)
    }
  }

  public async writeLockFile (data: any): Promise<void> {
    // get the lock file path
    const lockFile = this.getLockPath()

    // write data
    await writeFile(lockFile, data)
  }

  public hasLock (): boolean {
    return this.toLock.length > 0
  }

  public hasUnlock (): boolean {
    return this.toUnlock.length > 0
  }
}
