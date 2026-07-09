import { setLocalStorageWithCleanup } from './localStorageQuota';

interface CacheEntry {
    data: any;
    timestamp: number;
}

interface ServiceCacheOptions {
    prefix: string;
    useCleanupWrite?: boolean;
}

export function createServiceCache({ prefix, useCleanupWrite = false }: ServiceCacheOptions) {
    const memoryCache = new Map<string, CacheEntry>();
    const inFlightRequests = new Map<string, Promise<any>>();

    const readPersistedCache = (key: string, ttl: number): any => {
        try {
            const raw = localStorage.getItem(`${prefix}:${key}`);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as CacheEntry;
            if (!parsed || typeof parsed.timestamp !== 'number') return null;
            if (Date.now() - parsed.timestamp > ttl) {
                localStorage.removeItem(`${prefix}:${key}`);
                return null;
            }
            return parsed.data;
        } catch {
            return null;
        }
    };

    const writePersistedCache = (key: string, data: any, timestamp: number) => {
        try {
            const value = JSON.stringify({ data, timestamp });
            if (useCleanupWrite) {
                setLocalStorageWithCleanup(`${prefix}:${key}`, value);
            } else {
                localStorage.setItem(`${prefix}:${key}`, value);
            }
        } catch {
            // Ignore storage errors.
        }
    };

    const getCached = (key: string, ttl: number): any => {
        const cached = memoryCache.get(key);
        if (cached) {
            if (Date.now() - cached.timestamp < ttl) {
                return cached.data;
            }
            memoryCache.delete(key);
        }
        const persisted = readPersistedCache(key, ttl);
        if (persisted) {
            memoryCache.set(key, { data: persisted, timestamp: Date.now() });
            return persisted;
        }
        return null;
    };

    const setCached = (key: string, data: any, _customTtl?: number) => {
        const timestamp = Date.now();
        memoryCache.set(key, { data, timestamp });
        writePersistedCache(key, data, timestamp);
    };

    const fetchWithCache = async <T>(cacheKey: string, ttl: number, fetcher: () => Promise<T>): Promise<T> => {
        const cached = getCached(cacheKey, ttl);
        if (cached) {
            return cached as T;
        }
        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey)! as Promise<T>;
        }
        const request = fetcher()
            .then((result) => {
                setCached(cacheKey, result);
                return result;
            })
            .finally(() => {
                inFlightRequests.delete(cacheKey);
            });
        inFlightRequests.set(cacheKey, request);
        return request;
    };

    return {
        memoryCache,
        inFlightRequests,
        getCached,
        setCached,
        fetchWithCache,
    };
}
