import { describe, it, expect, vi } from 'vitest';
import { sendSuccess, sendError } from './api-response.js';

function mockResponse() {
    const res: Record<string, unknown> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as unknown as import('express').Response;
}

describe('sendSuccess', () => {
    it('sends 200 with success envelope', () => {
        const res = mockResponse();
        sendSuccess(res, { items: [1, 2, 3] });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, data: { items: [1, 2, 3] } });
    });

    it('allows custom status code', () => {
        const res = mockResponse();
        sendSuccess(res, null, 201);
        expect(res.status).toHaveBeenCalledWith(201);
    });
});

describe('sendError', () => {
    it('sends 500 with error envelope by default', () => {
        const res = mockResponse();
        sendError(res, 'Something went wrong');
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Something went wrong' });
    });

    it('allows custom status code', () => {
        const res = mockResponse();
        sendError(res, 'Not found', 404);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});
