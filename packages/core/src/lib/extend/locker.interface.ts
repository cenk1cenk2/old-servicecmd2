import { ObjectLiteral } from '@interfaces/object-literal.interface'

// TODO: extract data from path is it impossible?
export interface ILockData extends Partial<IUnlockData> {
  data: ObjectLiteral | string | string[]
  merge?: boolean
}

export interface IUnlockData {
  path: string
  enabled?: boolean
  root?: boolean
}
