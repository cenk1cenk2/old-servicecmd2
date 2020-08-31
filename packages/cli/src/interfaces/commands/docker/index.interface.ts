import { ServiceConfig } from '@context/config/services.interface'

export interface DockerCommandCtx {
  config: ServiceConfig
  services: string[]
  command: string
  discoveredServices: string[]
  parsedServices: Record<string, string[]>
}
