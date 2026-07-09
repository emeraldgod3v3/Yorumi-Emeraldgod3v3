import { describe, it, expect } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
    it('converts a simple title to a slug', () => {
        expect(slugify('Hello World')).toBe('hello-world');
    });

    it('handles the documented example', () => {
        expect(slugify("Frieren: Beyond Journey's End Season 2")).toBe(
            'frieren-beyond-journeys-end-season-2'
        );
    });

    it('removes straight apostrophes', () => {
        expect(slugify("It's a test")).toBe('its-a-test');
    });

    it('replaces curly quotes with hyphen (not in removal set)', () => {
        expect(slugify('It\u2018s a test')).toBe('it-s-a-test');
        expect(slugify('It\u2019s a test')).toBe('it-s-a-test');
    });

    it('replaces consecutive non-alphanumeric chars with a single hyphen', () => {
        expect(slugify('one---two   three')).toBe('one-two-three');
    });

    it('trims leading and trailing hyphens', () => {
        expect(slugify('---hello---')).toBe('hello');
        expect(slugify('!@# test $%^')).toBe('test');
    });

    it('truncates to 50 characters', () => {
        const long = 'a'.repeat(100);
        expect(slugify(long).length).toBe(50);
    });

    it('returns empty string for empty input', () => {
        expect(slugify('')).toBe('');
    });

    it('handles purely special-character input', () => {
        expect(slugify('!@#$%')).toBe('');
    });

    it('lowercases everything', () => {
        expect(slugify('UPPER CASE')).toBe('upper-case');
    });

    it('handles numbers correctly', () => {
        expect(slugify('Episode 10')).toBe('episode-10');
    });
});
