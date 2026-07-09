import { describe, it, expect } from 'vitest';
import { cacheUtils } from './cacheUtils';

describe('cacheUtils', () => {
    it('createCacheRef returns a new empty Map', () => {
        const cache = cacheUtils.createCacheRef<string, number>();
        expect(cache).toBeInstanceOf(Map);
        expect(cache.size).toBe(0);
    });

    it('set and get store and retrieve values', () => {
        const cache = cacheUtils.createCacheRef<string, number>();
        cacheUtils.set(cache, 'a', 1);
        expect(cacheUtils.get(cache, 'a')).toBe(1);
    });

    it('get returns undefined for missing keys', () => {
        const cache = cacheUtils.createCacheRef<string, number>();
        expect(cacheUtils.get(cache, 'missing')).toBeUndefined();
    });

    it('has returns true for existing keys and false otherwise', () => {
        const cache = cacheUtils.createCacheRef<string, string>();
        cacheUtils.set(cache, 'key', 'val');
        expect(cacheUtils.has(cache, 'key')).toBe(true);
        expect(cacheUtils.has(cache, 'other')).toBe(false);
    });

    it('delete removes a key', () => {
        const cache = cacheUtils.createCacheRef<string, number>();
        cacheUtils.set(cache, 'x', 42);
        cacheUtils.delete(cache, 'x');
        expect(cacheUtils.has(cache, 'x')).toBe(false);
    });

    it('clear empties the cache', () => {
        const cache = cacheUtils.createCacheRef<string, number>();
        cacheUtils.set(cache, 'a', 1);
        cacheUtils.set(cache, 'b', 2);
        cacheUtils.clear(cache);
        expect(cache.size).toBe(0);
    });
});
