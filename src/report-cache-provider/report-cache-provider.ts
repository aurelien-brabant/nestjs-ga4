export abstract class ReportCacheProvider {
  constructor (
    private readonly providerName
  ) {}

  abstract get (key: string): Promise<any | null>
  abstract set (key: string, report: any): Promise<any | null>

  /* should be overriden if a more efficient implementation is possible */
  async has (key: string): Promise<boolean> {
    return await this.get(key) !== null
  }

  getProviderName (): string {
    return this.providerName
  }
}
