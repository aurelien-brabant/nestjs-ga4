import {BetaAnalyticsDataClient} from '@google-analytics/data';
import { DynamicModule, Module } from '@nestjs/common';
import {readFileSync} from 'fs';
import { Ga4Service } from './ga4.service';
import { AsyncGa4ModuleConfig, Ga4ModuleConfig } from './interfaces';

@Module({})
export class Ga4Module {

  private static makeDataClient = (pathToCredentials: string): BetaAnalyticsDataClient => {
    const credentials = JSON.parse(readFileSync(pathToCredentials).toString());
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials
    })

    return analyticsDataClient;
  }

  public static forRootAsync(asyncGa4ModuleConfig: AsyncGa4ModuleConfig): DynamicModule {
    return {
      module: Ga4Module,
      imports: asyncGa4ModuleConfig.imports ?? [],
      exports: [
        Ga4Service,
        ...(asyncGa4ModuleConfig.exports ?? [])
      ],
      providers: [{
        provide: Ga4Service,
        inject: asyncGa4ModuleConfig.inject ?? [],
        useFactory: async (...args) => {
          const { pathToCredentials, reportCacheProvider }= await asyncGa4ModuleConfig.useFactory(...args);

          return new Ga4Service(
            this.makeDataClient(pathToCredentials),
            reportCacheProvider
          )
        }
      }]
    }
  }

  public static forRoot({ pathToCredentials, reportCacheProvider }: Ga4ModuleConfig): DynamicModule {
    return {
      module: Ga4Module,
      imports: [],
      exports: [Ga4Service],
      providers: [
        {
          provide: Ga4Service,
          useFactory: () => new Ga4Service(
            this.makeDataClient(pathToCredentials),
            reportCacheProvider
          )
        }
      ],
    }
  }

}
