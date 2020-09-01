import { IBooleanFlag, IOptionFlag } from '@oclif/parser/lib/flags'

import { DockerCommandFlagsWithLimitationTypes } from './index.constants'
import { ServiceConfig } from '@context/config/services.interface'

export interface DockerCommandCtx {
  config: ServiceConfig
  command: DockerCommandsAvailableInterface
  services: string[]
  parsedServices: Record<string, string[]>
}

export type DockerCommandFlagsWithLimitationInterface = {
  name: DockerCommandFlagsWithLimitationTypes
  type: 'string' | 'boolean'
  argument: 'direct-start' | 'with-double' | 'with-single' | 'direct-end'
  useChar?: boolean
  limits?: {
    services: number
  }
  description: string[]
  options?: IBooleanFlag<boolean> | IOptionFlag<any>
}

export interface DockerCommandsAvailableInterface {
  command: string
  deffered?: boolean
  headless?: boolean
  limitedFlags?: DockerCommandFlagsWithLimitationTypes[]
  keepOutput?: boolean
}
