export interface Ga4ModuleConfig {
  pathToCredentials: string
  disableCaching?: boolean
  defaultPropertyId?: string
  enableDynamicCachingLogs?: boolean
}

export interface AsyncGa4ModuleConfig {
  imports?: any[]
  inject?: any[]
  exports?: any[]
  useFactory: (...args: any[]) => Promise<Ga4ModuleConfig>
}
