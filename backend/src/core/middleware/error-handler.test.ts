import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { errorHandler } from './error-handler.js';
import { AppError } from '../errors/app-error.js';
import type { Request, Response, NextFunction } from 'express';

function mockRes() {
    const res: Record<string, unknown> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as unknown as Response;
}

function mockReq(overrides: Partial<Request> = {}) {
    return { method: 'GET', originalUrl: '/test', ...overrides } as Request;
}

describe('errorHandler', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sends exposed message for AppError with expose=true', () => {
        const res = mockRes();
        const err = new AppError('Bad input', 400);
        errorHandler(err, mockReq(), res, vi.fn() as unknown as NextFunction);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Bad input' });
    });

    it('hides internal message for AppError with expose=false', () => {
        const res = mockRes();
        const err = new AppError('DB crash', 500);
        errorHandler(err, mockReq(), res, vi.fn() as unknown as NextFunction);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Internal server error' });
    });

    it('wraps non-AppError in a 500 response', () => {
        const res = mockRes();
        errorHandler(new Error('random'), mockReq(), res, vi.fn() as unknown as NextFunction);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Internal server error' });
    });

    it('handles non-Error values', () => {
        const res = mockRes();
        errorHandler('string error', mockReq(), res, vi.fn() as unknown as NextFunction);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
