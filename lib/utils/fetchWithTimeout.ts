/**
 * Default timeout for API calls in milliseconds
 */
export const DEFAULT_API_TIMEOUT_MS = 10000;

/**
 * Fetch with timeout protection using AbortController
 * @param url - The URL to fetch
 * @param options - Optional fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns Promise<Response>
 * @throws Error with message containing 'timeout' if timeout occurs
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = DEFAULT_API_TIMEOUT_MS
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } catch (error) {
        // Robust timeout detection - check for AbortError name or abort/aborted/timeout in message
        // Note: DOMException from abort has name 'AbortError' which is the primary check
        if (error instanceof Error &&
            (error.name === 'AbortError' ||
             error.message.toLowerCase().includes('abort') ||
             error.message.toLowerCase().includes('timeout'))) {
            throw new Error(`Request timeout after ${timeoutMs}ms`);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}
