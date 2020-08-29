import { ServiceConfig } from '@context/config/services.interface'

export interface DockerCommandCtx {
  config: ServiceConfig
  services: string[]
}
