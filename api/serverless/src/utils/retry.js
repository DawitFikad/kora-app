"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
const logger_1 = __importDefault(require("./logger"));
/**
 * Executes a function with retries on failure.
 */
async function withRetry(fn, options = {}) {
    const { maxRetries = 3, initialDelay = 1000, onRetry } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            // Don't retry on status codes like 400, 401, 403, 404 (non-transient errors)
            if (error.response && [400, 401, 403, 404].includes(error.response.status)) {
                throw error;
            }
            if (attempt === maxRetries)
                break;
            const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
            logger_1.default.warn({ attempt, delay, error: error.message }, "Operation failed, retrying...");
            if (onRetry)
                onRetry(error, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
