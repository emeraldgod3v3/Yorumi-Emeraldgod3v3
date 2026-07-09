import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub localStorage before importing the module
const store = new Map<string, string>();
const localStorageMock = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn((key: string) => { store.delete(key); }),
    clear: vi.fn(() => store.clear()),
    get length() { return store.size; },
    key: vi.fn((i: number) => [...store.keys()][i] ?? null),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Import after mock is in place
const { pruneVolatileLocalStorage, setLocalStorageWithCleanup } = await import('./localStorageQuota');

beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
});

describe('pruneVolatileLocalStorage', () => {
    it('removes volatile keys sorted by size (largest first)', () => {
        store.set('yorumi_api_cache_abc', 'x'.repeat(100));
        store.set('yorumi_api_cache_def', 'y'.repeat(10));
        store.set('unrelated_key', 'keep me');

        pruneVolatileLocalStorage();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('yorumi_api_cache_abc');
        expect(store.has('unrelated_key')).toBe(true);
    });

    it('protects the provided key', () => {
        store.set('yorumi_api_cache_protected', 'data');
        pruneVolatileLocalStorage('yorumi_api_cache_protected');
        expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('yorumi_api_cache_protected');
    });

    it('does nothing when no volatile keys exist', () => {
        store.set('safe_key', 'value');
        pruneVolatileLocalStorage();
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
});

describe('setLocalStorageWithCleanup', () => {
    it('returns true on successful write', () => {
        expect(setLocalStorageWithCleanup('key', 'value')).toBe(true);
        expect(store.get('key')).toBe('value');
    });

    it('retries after pruning on QuotaExceededError', () => {
        let callCount = 0;
        localStorageMock.setItem.mockImplementation((key: string, value: string) => {
            callCount += 1;
            if (callCount === 1) {
                const error = new DOMException('QuotaExceededError');
                Object.defineProperty(error, 'name', { value: 'QuotaExceededError' });
                throw error;
            }
            store.set(key, value);
        });

        const result = setLocalStorageWithCleanup('retry_key', 'data');
        expect(result).toBe(true);
    });

    it('returns false on non-quota errors', () => {
        localStorageMock.setItem.mockImplementation(() => {
            throw new Error('SecurityError');
        });

        expect(setLocalStorageWithCleanup('k', 'v')).toBe(false);
    });
});
