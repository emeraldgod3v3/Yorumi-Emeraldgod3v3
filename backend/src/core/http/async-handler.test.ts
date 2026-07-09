import { describe, it, expect, vi } from 'vitest';
import { asyncHandler } from './async-handler.js';
import type { Request, Response, NextFunction } from 'express';

function fakeReqRes() {
    return {
        req: {} as Request,
        res: {} as Response,
        next: vi.fn() as NextFunction,
    };
}

describe('asyncHandler', () => {
    it('calls the handler and does not call next on success', async () => {
        const handler = vi.fn().mockResolvedValue('ok');
        const wrapped = asyncHandler(handler);
        const { req, res, next } = fakeReqRes();

        wrapped(req, res, next);

        // Wait for microtask
        await new Promise((r) => setTimeout(r, 0));

        expect(handler).toHaveBeenCalledWith(req, res, next);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next with error when handler rejects', async () => {
        const error = new Error('boom');
        const handler = vi.fn().mockRejectedValue(error);
        const wrapped = asyncHandler(handler);
        const { req, res, next } = fakeReqRes();

        wrapped(req, res, next);

        await new Promise((r) => setTimeout(r, 0));

        expect(next).toHaveBeenCalledWith(error);
    });

    it('does not catch synchronous throws (they propagate)', () => {
        const error = new Error('sync boom');
        const handler = vi.fn().mockImplementation(() => {
            throw error;
        });
        const wrapped = asyncHandler(handler);
        const { req, res, next } = fakeReqRes();

        expect(() => wrapped(req, res, next)).toThrow('sync boom');
    });
});
