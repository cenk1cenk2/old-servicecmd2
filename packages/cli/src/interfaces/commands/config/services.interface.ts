export type ServiceConfig = Record<string, ServiceProperties>

export interface ServicePrompt {
  path: string
  name: string
  file: string
}

export type ServiceProperties = {
  name: string
  path: string[]
  regex: false | number
  file: string[]
}
