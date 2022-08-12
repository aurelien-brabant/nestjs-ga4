import {BetaAnalyticsDataClient} from '@google-analytics/data';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Ga4Service {
  constructor(
    private readonly analyticsDataClient: BetaAnalyticsDataClient
  ) {}

  getAnalyticsDataClient(): BetaAnalyticsDataClient {
    return this.analyticsDataClient;
  }

}
