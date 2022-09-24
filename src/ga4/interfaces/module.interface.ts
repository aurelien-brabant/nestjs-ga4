import { Type } from "@nestjs/common";
import { ReportCacheProvider } from "src/report-cache-provider/report-cache-provider";

export interface Ga4ModuleConfig {
  pathToCredentials: string;
  reportCacheProvider?: ReportCacheProvider;
}

export interface AsyncGa4ModuleConfig {
    imports?: any[],
    inject?: any[];
    exports?: any[];
    useFactory: (...args: any[]) => Promise<Ga4ModuleConfig>;
}