import { describe, it, expect } from 'vitest';
import type { SkipTimestamp } from './skipTimestamps';
import {
    getIntroSkipTimestamp,
    getOutroSkipTimestamp,
    isInSkipRange,
    shouldSkipIntro,
    shouldSkipOutro,
} from './skipTimestamps';

const intro: SkipTimestamp = { start: 0, end: 90, type: 'op', episode: 1, skipType: 'intro' };
const outro: SkipTimestamp = { start: 1320, end: 1410, type: 'ed', episode: 1, skipType: 'outro' };
const stamps: SkipTimestamp[] = [intro, outro];

describe('getIntroSkipTimestamp', () => {
    it('returns the intro timestamp', () => {
        expect(getIntroSkipTimestamp(stamps)).toEqual(intro);
    });

    it('returns null when no intro exists', () => {
        expect(getIntroSkipTimestamp([outro])).toBeNull();
    });

    it('returns null for empty array', () => {
        expect(getIntroSkipTimestamp([])).toBeNull();
    });
});

describe('getOutroSkipTimestamp', () => {
    it('returns the outro timestamp', () => {
        expect(getOutroSkipTimestamp(stamps)).toEqual(outro);
    });

    it('returns null when no outro exists', () => {
        expect(getOutroSkipTimestamp([intro])).toBeNull();
    });
});

describe('isInSkipRange', () => {
    it('returns true when currentTime is within the range', () => {
        expect(isInSkipRange(45, intro)).toBe(true);
    });

    it('returns true at the boundary (within threshold)', () => {
        expect(isInSkipRange(91, intro, 1)).toBe(true);
    });

    it('returns false when outside range + threshold', () => {
        expect(isInSkipRange(100, intro, 1)).toBe(false);
    });

    it('returns false when skipTimestamp is null', () => {
        expect(isInSkipRange(10, null)).toBe(false);
    });

    it('returns true just before start within threshold', () => {
        expect(isInSkipRange(-0.5, intro, 1)).toBe(true);
    });
});

describe('shouldSkipIntro', () => {
    it('returns the end time when in intro range', () => {
        expect(shouldSkipIntro(10, stamps)).toBe(90);
    });

    it('returns null when not in intro range', () => {
        expect(shouldSkipIntro(200, stamps)).toBeNull();
    });

    it('returns null when no intro timestamp exists', () => {
        expect(shouldSkipIntro(10, [outro])).toBeNull();
    });

    it('returns null for empty timestamps', () => {
        expect(shouldSkipIntro(10, [])).toBeNull();
    });
});

describe('shouldSkipOutro', () => {
    const duration = 1440;

    it('returns the end time when in outro range', () => {
        expect(shouldSkipOutro(1350, stamps, duration)).toBe(1410);
    });

    it('caps return value to duration if outro end exceeds it', () => {
        const longOutro: SkipTimestamp = { start: 1400, end: 1500, type: 'ed', episode: 1, skipType: 'outro' };
        expect(shouldSkipOutro(1405, [longOutro], 1440)).toBe(1440);
    });

    it('returns null when not in outro range', () => {
        expect(shouldSkipOutro(100, stamps, duration)).toBeNull();
    });

    it('returns null when no outro exists', () => {
        expect(shouldSkipOutro(1350, [intro], duration)).toBeNull();
    });
});
