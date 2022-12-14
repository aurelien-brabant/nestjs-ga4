import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { google } from '@google-analytics/data/build/protos/protos'
import { Injectable, Logger } from '@nestjs/common'
import { createHash } from 'crypto'
import { Ga4ModuleConfig } from './interfaces'
import NodeCache from 'node-cache'

@Injectable()
export class Ga4Service {
  private readonly logger = new Logger(Ga4Service.name)
  private readonly defaultPropertyId?: string
  private readonly enableDynamicCachingLogs: boolean
  private readonly cache: NodeCache | null = null

  constructor (
    private readonly analyticsDataClient: BetaAnalyticsDataClient,
    moduleConfiguration: Ga4ModuleConfig
  ) {
    if (!moduleConfiguration.disableCaching) {
      this.cache = new NodeCache()
    }
    this.defaultPropertyId = moduleConfiguration.defaultPropertyId
    this.enableDynamicCachingLogs = typeof moduleConfiguration.enableDynamicCachingLogs !== 'undefined' && moduleConfiguration.enableDynamicCachingLogs
  }

  private hashReportRequest (reportRequest: any): string {
    return createHash('sha1').update(JSON.stringify(reportRequest)).digest('hex')
  }

  private async getReportFromCacheOrRequest (report: any, request: () => Promise<any>): Promise<any> {
    const reportHash = this.hashReportRequest(report)

    if (this.cache?.has(reportHash)) {
      const cachedReportResponse = await this.cache.get(reportHash)

      if (this.enableDynamicCachingLogs) {
        this.logger.verbose(`report ${reportHash} served from cache.`)
      }

      return cachedReportResponse
    }

    const reportResponse = await request()

    if (this.cache != null) {
      this.cache.set(reportHash, reportResponse)
      if (this.enableDynamicCachingLogs) {
        this.logger.verbose(`report ${reportHash} has been cached.`)
      }
    }

    return reportResponse
  }

  private applyDefaultPropertyToReport (
    report: google.analytics.data.v1beta.IRunReportRequest | google.analytics.data.v1beta.IBatchRunReportsRequest
  ): void {
    const hasReportProperty = typeof report.property === 'string'

    if (!hasReportProperty) {
      if (typeof this.defaultPropertyId === 'undefined') {
        throw new Error('No property was specified in the report request, and no default property ID was set.')
      }
      report.property = `properties/${this.defaultPropertyId}`
    }
  }

  mapDimensionsToMetrics<
    T extends Record<string, string> = Record<string, string>
  >(
    report: google.analytics.data.v1beta.IRunReportResponse
  ): T[] {
    const dimensions = report.dimensionHeaders?.map(({ name }) => name) ?? []
    const metrics = report.metricHeaders?.map(({ name }) => name) ?? []

    return report.rows?.map((row) => ({
      ...(row.dimensionValues?.reduce((acc, cur, index) => ({
        ...acc,
        [dimensions[String(index)]]: cur.value ?? ''
      }), {})),
      ...(row.metricValues?.reduce((acc, cur, index) => ({
        ...acc,
        [metrics[String(index)]]: cur.value ?? ''
      }), {}))
    }) as T) ?? []
  }

  async runReport (report: google.analytics.data.v1beta.IRunReportRequest & { property?: string }, callOptions = {}): Promise<[
    google.analytics.data.v1beta.IRunReportResponse,
    google.analytics.data.v1beta.IRunReportRequest | undefined,
    {} | undefined
  ]> {
    this.applyDefaultPropertyToReport(report)

    return await this.getReportFromCacheOrRequest(
      report,
      async () => await this.analyticsDataClient.runReport(report, callOptions)
    )
  }

  async runBatchReport (report: google.analytics.data.v1beta.IBatchRunReportsRequest, callOptions = {}): Promise<[
    google.analytics.data.v1beta.IBatchRunReportsResponse,
    google.analytics.data.v1beta.IBatchRunReportsRequest | undefined,
    {} | undefined
  ]> {
    this.applyDefaultPropertyToReport(report)

    return await this.getReportFromCacheOrRequest(
      report,
      async () => await this.runBatchReport(report, callOptions)
    )
  }

  /**
   * Returns the instance of the BetaAnalyticsDataClient which is used internally
   * by the service.
   * All the service specific capabilites such as caching won't be applied if requesting reports
   * with this.
   * Only use this if you need to use very specific methods the service does not wrap.
   */
  getUnderlyingDataClient (): BetaAnalyticsDataClient {
    return this.analyticsDataClient
  }
}
