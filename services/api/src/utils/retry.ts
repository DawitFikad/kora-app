import logger from "./logger";

/**
 * Executes a function with retries on failure.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelay?: number;
        onRetry?: (error: any, attempt: number) => void;
    } = {}
): Promise<T> {
    const { maxRetries = 3, initialDelay = 1000, onRetry } = options;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Don't retry on status codes like 400, 401, 403, 404 (non-transient errors)
            if (error.response && [400, 401, 403, 404].includes(error.response.status)) {
                throw error;
            }

            if (attempt === maxRetries) break;

            const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
            logger.warn({ attempt, delay, error: error.message }, "Operation failed, retrying...");

            if (onRetry) onRetry(error, attempt);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}
