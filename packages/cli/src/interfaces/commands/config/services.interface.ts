export type ServiceConfig = Record<string, ServiceProperties>

export interface ServiceProperties {
  path: string
  name: string
  regex: boolean
}
