/**
 * Tests for fetchWithTimeout utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout, DEFAULT_API_TIMEOUT_MS } from '@/lib/utils/fetchWithTimeout';

describe('fetchWithTimeout', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return response when fetch succeeds before timeout', async () => {
        const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

        const result = await fetchWithTimeout('https://example.com/api');

        expect(result).toBe(mockResponse);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith(
            'https://example.com/api',
            expect.objectContaining({
                signal: expect.any(AbortSignal),
            })
        );
    });

    it('should throw timeout error when fetch takes longer than timeout', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch').mockImplementationOnce(async (url, options) => {
            const signal = options?.signal;
            if (signal) {
                return new Promise((_, reject) => {
                    signal.addEventListener('abort', () => {
                        // Create error with proper AbortError name
                        const error = new Error('The operation was aborted.');
                        error.name = 'AbortError';
                        reject(error);
                    });
                });
            }
            return new Response('ok');
        });

        const shortTimeout = 100; // 100ms timeout
        await expect(fetchWithTimeout('https://example.com/api', {}, shortTimeout))
            .rejects.toThrow('Request timeout after 100ms');
        
        expect(fetchSpy).toHaveBeenCalled();
    }, 5000);

    it('should throw timeout error with default timeout when not specified', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch').mockImplementationOnce(async (url, options) => {
            const signal = options?.signal;
            if (signal) {
                return new Promise((_, reject) => {
                    signal.addEventListener('abort', () => {
                        const error = new Error('The operation was aborted.');
                        error.name = 'AbortError';
                        reject(error);
                    });
                });
            }
            return new Response('ok');
        });

        await expect(fetchWithTimeout('https://example.com/api'))
            .rejects.toThrow(`Request timeout after ${DEFAULT_API_TIMEOUT_MS}ms`);
        
        expect(fetchSpy).toHaveBeenCalled();
    }, 15000);

    it('should pass custom options to fetch', async () => {
        const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
            status: 200,
        });
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

        const customOptions: RequestInit = {
            method: 'POST',
            headers: { 'Custom-Header': 'test-value' },
            body: JSON.stringify({ key: 'value' }),
        };

        await fetchWithTimeout('https://example.com/api', customOptions);

        expect(fetchSpy).toHaveBeenCalledWith(
            'https://example.com/api',
            expect.objectContaining({
                ...customOptions,
                signal: expect.any(AbortSignal),
            })
        );
    });

    it('should use custom timeout when provided', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch').mockImplementationOnce(async (url, options) => {
            const signal = options?.signal;
            if (signal) {
                return new Promise((_, reject) => {
                    signal.addEventListener('abort', () => {
                        const error = new Error('The operation was aborted.');
                        error.name = 'AbortError';
                        reject(error);
                    });
                });
            }
            return new Response('ok');
        });

        const customTimeout = 500;
        await expect(fetchWithTimeout('https://example.com/api', {}, customTimeout))
            .rejects.toThrow(`Request timeout after ${customTimeout}ms`);
        
        expect(fetchSpy).toHaveBeenCalled();
    }, 5000);

    it('should clear timeout when fetch succeeds', async () => {
        const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
            status: 200,
        });
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
        vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

        await fetchWithTimeout('https://example.com/api');

        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
    });

    it('should handle non-timeout errors correctly', async () => {
        const networkError = new Error('Network error');
        vi.spyOn(global, 'fetch').mockRejectedValueOnce(networkError);

        await expect(fetchWithTimeout('https://example.com/api')).rejects.toThrow('Network error');
    });

    it('should handle abort errors from external abort signals', async () => {
        const controller = new AbortController();
        controller.abort(); // Abort immediately
        
        // When signal is already aborted, fetch throws immediately with AbortError
        vi.spyOn(global, 'fetch').mockImplementationOnce(() => {
            const error = new Error('The operation was aborted.');
            error.name = 'AbortError';
            throw error;
        });

        // The function should convert AbortError to timeout error
        await expect(
            fetchWithTimeout('https://example.com/api', { signal: controller.signal })
        ).rejects.toThrow('Request timeout after');
    });
});
