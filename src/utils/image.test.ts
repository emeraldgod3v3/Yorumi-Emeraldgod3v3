import { describe, it, expect } from 'vitest';
import { getDisplayImageUrl } from './image';

describe('getDisplayImageUrl', () => {
    it('returns empty string for null/undefined/empty', () => {
        expect(getDisplayImageUrl(null)).toBe('');
        expect(getDisplayImageUrl(undefined)).toBe('');
        expect(getDisplayImageUrl('')).toBe('');
    });

    it('passes through data: URIs', () => {
        expect(getDisplayImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    });

    it('passes through blob: URIs', () => {
        expect(getDisplayImageUrl('blob:http://localhost/abc')).toBe('blob:http://localhost/abc');
    });

    it('passes through /api/ paths', () => {
        expect(getDisplayImageUrl('/api/image/proxy')).toBe('/api/image/proxy');
    });

    it('proxies animepahe URLs', () => {
        const url = 'https://i.animepahe.ru/poster.jpg';
        const result = getDisplayImageUrl(url);
        expect(result).toContain('/image/proxy?url=');
        expect(result).toContain(encodeURIComponent(url));
    });

    it('proxies mangakatana URLs', () => {
        const url = 'https://mangakatana.com/cover.jpg';
        const result = getDisplayImageUrl(url);
        expect(result).toContain('/image/proxy?url=');
    });

    it('does not proxy anilist or other non-matched URLs', () => {
        const url = 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large.jpg';
        expect(getDisplayImageUrl(url)).toBe(url);
    });

    it('returns the original string for invalid URLs', () => {
        expect(getDisplayImageUrl('not-a-url')).toBe('not-a-url');
    });
});
