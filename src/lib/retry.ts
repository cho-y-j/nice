import { NicePayError } from './nicepay/errors.js';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

const RETRYABLE_CODES = new Set(['TIMEOUT', 'NETWORK_ERROR']);

function isRetryable(error: unknown): boolean {
  if (error instanceof NicePayError) {
    return RETRYABLE_CODES.has(error.code);
  }
  return false;
}

function jitter(): number {
  return Math.random() * 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 2, baseDelay = 1000, maxDelay = 10000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRetryable(error)) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt) + jitter(), maxDelay);
      await sleep(delay);
    }
  }

  // Unreachable, but TypeScript needs it
  throw new Error('Retry exhausted');
}
