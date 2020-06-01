import { ObjectLiteral } from './object-literal.interface'

export interface IDefaultConfig {
  local: boolean
  config: ObjectLiteral
  path?: string
}
