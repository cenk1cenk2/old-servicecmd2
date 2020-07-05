export type ServiceConfig = Record<string, ServiceProperties>

export interface ServicePrompt {
  path: string
  name: string
}

export type ServiceProperties = {
  name: string
  path: string[]
  regex: false | number
}
