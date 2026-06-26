import { describe, it, expect, beforeEach, vi } from 'vitest';

// The module reads UPSTASH env vars at import time.
// With no env vars set, it falls back to in-memory storage, which is what we test.
const { cacheGet, cacheSet, acquireLock, releaseLock } = await import('./redis-cache.js');

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('cacheGet / cacheSet (memory fallback)', () => {
    it('returns null for a missing key', async () => {
        expect(await cacheGet('nonexistent')).toBeNull();
    });

    it('stores and retrieves a value', async () => {
        await cacheSet('test-key', { hello: 'world' }, 60);
        const result = await cacheGet<{ hello: string }>('test-key');
        expect(result).toEqual({ hello: 'world' });
    });

    it('returns null after TTL expires', async () => {
        vi.useFakeTimers();
        await cacheSet('ttl-key', 'val', 1);

        expect(await cacheGet('ttl-key')).toBe('val');

        vi.advanceTimersByTime(2000);
        expect(await cacheGet('ttl-key')).toBeNull();

        vi.useRealTimers();
    });
});

describe('acquireLock / releaseLock (memory fallback)', () => {
    it('acquires a lock and prevents re-acquisition', async () => {
        const key = 'lock-test-' + Date.now();
        expect(await acquireLock(key, 10)).toBe(true);
        expect(await acquireLock(key, 10)).toBe(false);
    });

    it('releases a lock so it can be re-acquired', async () => {
        const key = 'lock-release-' + Date.now();
        await acquireLock(key, 10);
        await releaseLock(key);
        expect(await acquireLock(key, 10)).toBe(true);
    });

    it('auto-expires after TTL', async () => {
        vi.useFakeTimers();
        const key = 'lock-ttl-' + Date.now();
        await acquireLock(key, 1);

        vi.advanceTimersByTime(2000);
        expect(await acquireLock(key, 1)).toBe(true);

        vi.useRealTimers();
    });
});
