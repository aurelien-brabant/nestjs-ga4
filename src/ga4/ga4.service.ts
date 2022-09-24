import {BetaAnalyticsDataClient} from '@google-analytics/data';
import { google } from '@google-analytics/data/build/protos/protos';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHash } from 'crypto';
import { ReportCacheProvider } from '../report-cache-provider/report-cache-provider';

@Injectable()
export class Ga4Service implements OnModuleInit {
  private logger = new Logger(Ga4Service.name);

  constructor(
    public readonly analyticsDataClient: BetaAnalyticsDataClient,
    private readonly reportCacheProvider?: ReportCacheProvider
  ) {
  }

  onModuleInit() {
    if (this.reportCacheProvider) {
      this.logger.verbose(`Using ${this.reportCacheProvider.getProviderName()} to cache reports.`)
    }
  }

  private hashReportRequest(reportRequest: any ): string {
    return createHash('sha1').update(JSON.stringify(reportRequest)).digest('hex');
  }
  
  private async getReportFromCacheOrRequest(report: any, request: () => Promise<any>): Promise<any> {
     const reportHash = this.hashReportRequest(report);

      if (await this.reportCacheProvider?.has(reportHash)) {
        const cachedReportResponse = await this.reportCacheProvider.get(reportHash) as any;

        this.logger.verbose(`report ${reportHash} served from cache.`)

        return cachedReportResponse;
      }

      const reportResponse = await request();

      if (this.reportCacheProvider) {
        await this.reportCacheProvider.set(reportHash, reportResponse);
        this.logger.verbose(`report ${reportHash} has been cached.`)
      }

      return reportResponse;
  }

  mapDimensionsToMetrics<
    T extends Record<string, string> = Record<string, string>
  >(
    report: google.analytics.data.v1beta.IRunReportResponse
  )
  : Array<T> {
    const dimensions = report.dimensionHeaders.map(({ name }) => name);
    const metrics = report.metricHeaders.map(({ name }) => name);
    
    return report.rows.map((row) => ({
      ...(row.dimensionValues.reduce((acc, cur, index) => ({
        ...acc,
        [dimensions[index]]: cur.value ?? ''
      }), {})),
      ...(row.metricValues.reduce((acc, cur, index) => ({
        ...acc,
        [metrics[index]]: cur.value ?? ''
      }), {}))
    }) as T)
  }

  async runReport(report: google.analytics.data.v1beta.IRunReportRequest, callOptions = {})
  : Promise<[
        google.analytics.data.v1beta.IRunReportResponse,
        google.analytics.data.v1beta.IRunReportRequest | undefined,
        {} | undefined
      ]> 
    {
      return this.getReportFromCacheOrRequest(
        report,
        () => this.analyticsDataClient.runReport(report, callOptions)
      );
  }

  async runBatchReport(report: google.analytics.data.v1beta.IBatchRunReportsRequest, callOptions = {})
  : Promise<[
        google.analytics.data.v1beta.IBatchRunReportsResponse,
        google.analytics.data.v1beta.IBatchRunReportsRequest | undefined,
        {} | undefined
    ]>
  {
    return this.getReportFromCacheOrRequest(
      report,
      () => this.runBatchReport(report, callOptions)
    )
  }


  /**
   * Returns the instance of the BetaAnalyticsDataClient which is used internally
   * by the service.
   * All the service specific capabilites such as caching won't be applied if requesting reports
   * with this.
   * Only use this if you need to use very specific methods the service does not wrap.
   */
  getUnderlyingDataClient(): BetaAnalyticsDataClient {
    return this.analyticsDataClient;
  }

}
