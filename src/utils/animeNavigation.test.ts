import { describe, it, expect } from 'vitest';
import {
    isAnimePaheSessionId,
    isGenericScraperSessionId,
    isProviderScraperSessionId,
    isSupportedScraperSessionId,
    getDirectScraperRouteId,
    getAnimeDetailsRouteId,
    getAnimeWatchRouteId,
} from './animeNavigation';

describe('isAnimePaheSessionId', () => {
    it('accepts valid UUID-v4-like strings', () => {
        expect(isAnimePaheSessionId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
    });

    it('rejects non-UUID strings', () => {
        expect(isAnimePaheSessionId('not-a-uuid')).toBe(false);
        expect(isAnimePaheSessionId('')).toBe(false);
    });
});

describe('isGenericScraperSessionId', () => {
    it('accepts alphanumeric-hyphen strings', () => {
        expect(isGenericScraperSessionId('abc-123')).toBe(true);
        expect(isGenericScraperSessionId('simple')).toBe(true);
    });

    it('rejects strings with special characters', () => {
        expect(isGenericScraperSessionId('has spaces')).toBe(false);
        expect(isGenericScraperSessionId('')).toBe(false);
    });
});

describe('isProviderScraperSessionId', () => {
    it('accepts consumet-prefixed ids', () => {
        expect(isProviderScraperSessionId('consumet:gogoanime:some-id')).toBe(true);
    });

    it('rejects non-consumet ids', () => {
        expect(isProviderScraperSessionId('other:provider:id')).toBe(false);
    });
});

describe('isSupportedScraperSessionId', () => {
    it('returns true for any supported format', () => {
        expect(isSupportedScraperSessionId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
        expect(isSupportedScraperSessionId('simple-id')).toBe(true);
        expect(isSupportedScraperSessionId('consumet:gogo:x')).toBe(true);
    });

    it('returns false for empty or whitespace', () => {
        expect(isSupportedScraperSessionId('')).toBe(false);
        expect(isSupportedScraperSessionId(null)).toBe(false);
    });
});

describe('getDirectScraperRouteId', () => {
    it('wraps a valid session in s: prefix', () => {
        expect(getDirectScraperRouteId('abc-123')).toBe('s:abc-123');
    });

    it('strips leading URL parts', () => {
        expect(getDirectScraperRouteId('https://example.com/watch/abc-123')).toBe('s:abc-123');
    });

    it('returns empty string for invalid values', () => {
        expect(getDirectScraperRouteId('')).toBe('');
        expect(getDirectScraperRouteId(null)).toBe('');
    });

    it('does not double-prefix s:', () => {
        expect(getDirectScraperRouteId('s:abc-123')).toBe('s:abc-123');
    });
});

describe('getAnimeDetailsRouteId', () => {
    it('prefers anilist id (item.id)', () => {
        expect(getAnimeDetailsRouteId({ id: 123, mal_id: 456 })).toBe(123);
    });

    it('falls back to mal_id', () => {
        expect(getAnimeDetailsRouteId({ mal_id: 456 })).toBe(456);
    });

    it('falls back to scraper route id', () => {
        expect(getAnimeDetailsRouteId({ scraperId: 'abc-123' })).toBe('s:abc-123');
    });

    it('returns empty string when nothing matches', () => {
        expect(getAnimeDetailsRouteId({})).toBe('');
    });

    it('ignores non-positive numbers', () => {
        expect(getAnimeDetailsRouteId({ id: 0, mal_id: -1 })).toBe('');
    });
});

describe('getAnimeWatchRouteId', () => {
    it('prefers scraper route id', () => {
        expect(getAnimeWatchRouteId({ id: 123, scraperId: 'abc-123' })).toBe('s:abc-123');
    });

    it('falls back to mal_id', () => {
        expect(getAnimeWatchRouteId({ mal_id: 456 })).toBe(456);
    });

    it('falls back to anilist id', () => {
        expect(getAnimeWatchRouteId({ id: 789 })).toBe(789);
    });

    it('returns 0 when nothing matches', () => {
        expect(getAnimeWatchRouteId({})).toBe(0);
    });
});
