import { describe, it, expect } from 'vitest';
import { AppError } from './app-error.js';

describe('AppError', () => {
    it('sets default statusCode to 500', () => {
        const err = new AppError('server broke');
        expect(err.statusCode).toBe(500);
    });

    it('accepts a custom statusCode', () => {
        const err = new AppError('not found', 404);
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('not found');
    });

    it('sets expose to true for client errors (< 500) by default', () => {
        expect(new AppError('bad request', 400).expose).toBe(true);
        expect(new AppError('unauthorized', 401).expose).toBe(true);
    });

    it('sets expose to false for server errors (>= 500) by default', () => {
        expect(new AppError('oops', 500).expose).toBe(false);
        expect(new AppError('not implemented', 501).expose).toBe(false);
    });

    it('allows overriding expose via options', () => {
        const err = new AppError('secret error', 400, { expose: false });
        expect(err.expose).toBe(false);

        const err2 = new AppError('debug info', 500, { expose: true });
        expect(err2.expose).toBe(true);
    });

    it('has name set to AppError', () => {
        expect(new AppError('test').name).toBe('AppError');
    });

    it('is an instance of Error', () => {
        expect(new AppError('test')).toBeInstanceOf(Error);
    });
});
