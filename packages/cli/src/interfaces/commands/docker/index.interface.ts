import { DockerCommandsAvailableInterface } from './index.constants'
import { ServiceConfig } from '@context/config/services.interface'

export interface DockerCommandCtx {
  config: ServiceConfig
  services: string[]
  command: DockerCommandsAvailableInterface
  allServices: string[]
  discoveredServices: string[]
  parsedServices: Record<string, string[]>
}
