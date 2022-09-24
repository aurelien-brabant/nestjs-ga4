import { readFileSync, writeFileSync } from 'fs'
import { ReportCacheProvider } from './report-cache-provider'

export interface MemoryReportCacheProviderOptions {
  keyLifetime?: number
  loadFromFileAtPath?: string
  saveToFileAtPath?: string
  resetTimestampsOnLoadFromFile?: boolean
}

interface WrappedValue {
  value: any
  setAtTimestamp: number
}

type MemoryStore = Record<string, WrappedValue | undefined>

export class MemoryReportCacheProvider extends ReportCacheProvider {
  private memoryStore: MemoryStore = {}

  constructor (
    private readonly config: MemoryReportCacheProviderOptions = {}
  ) {
    super(MemoryReportCacheProvider.name)
  }

  public initialize (): boolean {
    if (typeof this.config.loadFromFileAtPath === 'undefined') {
      return false
    }

    const buf = readFileSync(this.config.loadFromFileAtPath)
    const memoryStore = JSON.parse(buf.toString()) as MemoryStore

    if (this.config.resetTimestampsOnLoadFromFile === true) {
      for (const wrappedValue of Object.values(memoryStore)) {
        (wrappedValue as WrappedValue).setAtTimestamp = Date.now()
      }
    }

    this.memoryStore = memoryStore

    return true
  }

  async get (key: string): Promise<any> {
    const wrappedValue = this.memoryStore[key]

    if (typeof wrappedValue === 'undefined') {
      return null
    }

    if (
      typeof this.config.keyLifetime === 'number' &&
            Date.now() - wrappedValue.setAtTimestamp > this.config.keyLifetime * 1000
    ) {
      this.delete(key)

      return null
    }

    return wrappedValue.value ?? null
  }

  async set (key: string, report: any): Promise<any> {
    const wrappedValue: WrappedValue = {
      setAtTimestamp: Date.now(),
      value: report
    }

    this.memoryStore[key] = wrappedValue

    return wrappedValue
  }

  public destroy (): boolean {
    if (typeof this.config.saveToFileAtPath === 'string') {
      writeFileSync(this.config.saveToFileAtPath, JSON.stringify(this.memoryStore))

      return true
    }

    return false
  }

  delete (key: string): void {
    const { [key]: _, ...cleanedStore } = this.memoryStore

    this.memoryStore = cleanedStore
  }
}
