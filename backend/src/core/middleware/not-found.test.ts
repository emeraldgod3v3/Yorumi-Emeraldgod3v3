import { describe, it, expect, vi } from 'vitest';
import { notFoundHandler } from './not-found.js';
import type { Request, Response } from 'express';

describe('notFoundHandler', () => {
    it('returns 404 with "Route not found" message', () => {
        const res: Record<string, unknown> = {};
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);

        notFoundHandler({} as Request, res as unknown as Response);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Route not found' });
    });
});
