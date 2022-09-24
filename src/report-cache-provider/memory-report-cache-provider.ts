import { ReportCacheProvider } from "./report-cache-provider";

export interface MemoryReportCacheProviderOptions {
    keyLifetime?: number;
}

interface WrappedValue {
    value: any;
    setAtTimestamp: number;
}

export class MemoryReportCacheProvider extends ReportCacheProvider {
    private memoryStore: Record<string, WrappedValue> = {};

    constructor(
        private readonly config: MemoryReportCacheProviderOptions = {}
    ) {
        super(MemoryReportCacheProvider.name);
    }

    get(key: string): Promise<any> {
        const wrappedValue = this.memoryStore[key];

        if (!wrappedValue) {
            return null;
        }

        if (
            this.config.keyLifetime
            && Date.now() - wrappedValue.setAtTimestamp > this.config.keyLifetime * 1000
        ) {
            this.delete(key);

            return null;
        }

        return wrappedValue.value ?? null;
    }

    set(key: string, report: any): Promise<any> {
        this.memoryStore[key] = {
            setAtTimestamp: Date.now(),
            value: report
        };

        return this.memoryStore[key].value;
    }


    delete(key: string): void {
        delete this.memoryStore[key];
    }
}