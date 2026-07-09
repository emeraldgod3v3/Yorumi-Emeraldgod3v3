import { describe, it, expect } from 'vitest';
import { getMappedQuality } from './streamUtils';

describe('getMappedQuality', () => {
    it('maps 1080 and above to 1080P', () => {
        expect(getMappedQuality('1080')).toBe('1080P');
        expect(getMappedQuality('1920')).toBe('1080P');
        expect(getMappedQuality('1000')).toBe('1080P');
    });

    it('maps 720-999 to 720P', () => {
        expect(getMappedQuality('720')).toBe('720P');
        expect(getMappedQuality('600')).toBe('720P');
        expect(getMappedQuality('999')).toBe('720P');
    });

    it('maps below 600 to 360P', () => {
        expect(getMappedQuality('480')).toBe('360P');
        expect(getMappedQuality('360')).toBe('360P');
        expect(getMappedQuality('0')).toBe('360P');
    });

    it('handles non-numeric strings', () => {
        expect(getMappedQuality('auto')).toBe('360P');
        expect(getMappedQuality('')).toBe('360P');
    });
});
