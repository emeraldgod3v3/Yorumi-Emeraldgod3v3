import { describe, it, expect } from 'vitest';
import { getDisplayTitle, getSecondaryTitle } from './titleLanguage';

describe('getDisplayTitle', () => {
    it('returns english title when language is eng', () => {
        const item = { title_english: 'Attack on Titan', title_romaji: 'Shingeki no Kyojin' };
        expect(getDisplayTitle(item, 'eng')).toBe('Attack on Titan');
    });

    it('returns romaji title when language is jpy', () => {
        const item = { title_english: 'Attack on Titan', title_romaji: 'Shingeki no Kyojin' };
        expect(getDisplayTitle(item, 'jpy')).toBe('Shingeki no Kyojin');
    });

    it('falls back to romaji when english is missing (eng mode)', () => {
        const item = { title_romaji: 'Shingeki no Kyojin' };
        expect(getDisplayTitle(item, 'eng')).toBe('Shingeki no Kyojin');
    });

    it('falls back to english when romaji is missing (jpy mode)', () => {
        const item = { title_english: 'Attack on Titan' };
        expect(getDisplayTitle(item, 'jpy')).toBe('Attack on Titan');
    });

    it('returns "Unknown" when no titles are available', () => {
        expect(getDisplayTitle({}, 'eng')).toBe('Unknown');
        expect(getDisplayTitle({}, 'jpy')).toBe('Unknown');
    });

    it('uses synonyms as fallback', () => {
        const item = { synonyms: ['AoT'] };
        expect(getDisplayTitle(item, 'eng')).toBe('AoT');
    });

    it('skips blank / whitespace-only strings', () => {
        const item = { title_english: '   ', title_romaji: 'Valid' };
        expect(getDisplayTitle(item, 'eng')).toBe('Valid');
    });

    it('prefers latin synonyms in eng mode', () => {
        const item = { synonyms: ['\u9032\u6483\u306e\u5de8\u4eba', 'AoT'] };
        expect(getDisplayTitle(item, 'eng')).toBe('AoT');
    });

    it('uses title_native as deep fallback in eng mode', () => {
        const item = { title_native: '\u9032\u6483\u306e\u5de8\u4eba' };
        expect(getDisplayTitle(item, 'eng')).toBe('\u9032\u6483\u306e\u5de8\u4eba');
    });
});

describe('getSecondaryTitle', () => {
    it('returns the alternate-language title', () => {
        const item = { title_english: 'Attack on Titan', title_romaji: 'Shingeki no Kyojin' };
        expect(getSecondaryTitle(item, 'eng')).toBe('Shingeki no Kyojin');
        expect(getSecondaryTitle(item, 'jpy')).toBe('Attack on Titan');
    });

    it('returns empty string when primary and secondary are the same', () => {
        const item = { title_english: 'Same', title_romaji: 'Same' };
        expect(getSecondaryTitle(item, 'eng')).toBe('');
    });

    it('returns empty string when no secondary exists', () => {
        const item = { title_english: 'Only' };
        expect(getSecondaryTitle(item, 'eng')).toBe('');
    });
});
