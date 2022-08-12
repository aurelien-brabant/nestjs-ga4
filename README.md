# nestjs-ga4

A NestJS module and service that integrate the `@google-analytics/data` package.

## Install

```sh
npm install @aurelle/nestjs-ga4

# using yarn

yarn add @aurelle/nestjs-ga4
```

## Usage

This package exports a `Ga4Module` module that should be dynamically registered like so:

src/app.module.ts

```ts
import { join } from "path";

import { Ga4Module } from "@aurelle/nestjs-ga4";

@Module({
  imports: [
    Ga4Module.register({
      /* in this example, the file holding the credentials is located at src/common/ga4/config.json */
      pathToGoogleApplicationCredentials: join(
        process.cwd(),
        "src",
        "common",
        "ga4",
        "config.json"
      ),
    }),
  ],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
```

As soon as the module is registered, it is possible to inject the `Ga4Service` using the standard NestJS dependency injection system:

src/app.service.ts

```ts
import { Injectable } from "@nestjs/common";
import { Ga4Service } from "@aurelle/nestjs-ga4";

@Injectable()
export class AppService {
  constructor(private readonly ga4Service: Ga4Service) {}

  async reportSessionSources() {
    const ga = this.ga4Service.getAnalyticsDataClient();

    const report = await ga.runReport({
      /* or use the ConfigService instead of process.env */
      property: `properties/${process.env.GA_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: "02-01-2022",
          endDate: "04-01-2022",
        },
      ],
      dimensions: [
        {
          name: "sessionSource",
        },
      ],
      metrics: [
        {
          name: "sessions",
        },
      ],
    });

    return report;
  }
}
```
