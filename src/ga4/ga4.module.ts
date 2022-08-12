import {BetaAnalyticsDataClient} from '@google-analytics/data';
import { DynamicModule, Module } from '@nestjs/common';
import {readFileSync} from 'fs';
import { Ga4Service } from './ga4.service';

interface Ga4ModuleConfig {
  pathToGoogleApplicationCredentials: string;
}

@Module({})
export class Ga4Module {

  static register({ pathToGoogleApplicationCredentials }: Ga4ModuleConfig): DynamicModule {
    return {
      module: Ga4Module,
      imports: [],
      providers: [
        {
          provide: Ga4Service,
          useFactory: () => {
            const credentials = JSON.parse(readFileSync(pathToGoogleApplicationCredentials).toString());
            const analyticsDataClient = new BetaAnalyticsDataClient({
              credentials
            })
            
            return new Ga4Service(analyticsDataClient);
          }
        }
      ],
      exports: [Ga4Service]
    }
  }

}
