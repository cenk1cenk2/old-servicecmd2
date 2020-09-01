import { DockerCommandsAvailableInterface } from './index.constants'
import { ServiceConfig } from '@context/config/services.interface'

export interface DockerCommandCtx {
  config: ServiceConfig
  command: DockerCommandsAvailableInterface
  services: string[]
  parsedServices: Record<string, string[]>
}
