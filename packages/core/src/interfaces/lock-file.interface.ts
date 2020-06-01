/* eslint-disable @typescript-eslint/no-empty-interface */
import { ObjectLiteral, ObjectLiteralString } from '@interfaces/object-literal.interface'

export interface ILockFile {}

export interface ILockEntityString {
  [name: string]: string
}

export interface ILockEntityStringArray {
  [name: string]: string[]
}

export interface ILockEntityObject {
  [name: string]: ObjectLiteral
}

export interface ILockEntityObjectString {
  [name: string]: ObjectLiteralString
}

export interface ILockEntityObjectArray {
  [name: string]: ObjectLiteral[]
}
