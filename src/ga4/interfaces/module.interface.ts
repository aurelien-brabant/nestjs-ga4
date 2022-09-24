import { ReportCacheProvider } from 'src/report-cache-provider/report-cache-provider'

export interface Ga4ModuleConfig {
  pathToCredentials: string
  reportCacheProvider?: ReportCacheProvider
  defaultPropertyId?: string
}

export interface AsyncGa4ModuleConfig {
  imports?: any[]
  inject?: any[]
  exports?: any[]
  useFactory: (...args: any[]) => Promise<Ga4ModuleConfig>
}
