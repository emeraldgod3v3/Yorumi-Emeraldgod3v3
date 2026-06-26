import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to re-import the logger for each test to pick up env changes,
// but for simplicity we test the exported singleton with default LOG_LEVEL=info.
import { logger } from './logger.js';

describe('logger', () => {
    beforeEach(() => {
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('info writes to console.info', () => {
        logger.info('test message');
        expect(console.info).toHaveBeenCalledTimes(1);
        const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(call).toContain('[INFO]');
        expect(call).toContain('test message');
    });

    it('warn writes to console.warn', () => {
        logger.warn('warning');
        expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('error writes to console.error with meta', () => {
        logger.error('err msg', { detail: 42 });
        expect(console.error).toHaveBeenCalledTimes(1);
        const args = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(args[0]).toContain('[ERROR]');
        expect(args[1]).toEqual({ detail: 42 });
    });

    it('debug is suppressed at default info level', () => {
        logger.debug('should not appear');
        expect(console.debug).not.toHaveBeenCalled();
    });

    it('info omits meta argument when undefined', () => {
        logger.info('no meta');
        const args = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(args).toHaveLength(1);
    });
});
