/**
 * Async utility helpers: debounce, throttle, and sleep.
 */

/**
 * Creates a debounced version of a function.
 * The debounced function delays invoking the original until after
 * the specified wait time has elapsed since the last call.
 *
 * @param fn - The function to debounce
 * @param wait - Milliseconds to delay
 * @returns Debounced function with a cancel method
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = undefined;
    }, wait);
  } as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced;
}

/**
 * Creates a throttled version of a function.
 * The throttled function only invokes the original at most once
 * per every wait milliseconds.
 *
 * @param fn - The function to throttle
 * @param wait - Minimum milliseconds between invocations
 * @returns Throttled function with a cancel method
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): T & { cancel: () => void } {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      lastCall = now;
      fn.apply(this, args);
    } else if (timeoutId === undefined) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = undefined;
        fn.apply(this, args);
      }, remaining);
    }
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    lastCall = 0;
  };

  return throttled;
}

/**
 * Returns a promise that resolves after the specified duration.
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async function with exponential backoff.
 *
 * @param fn - The async function to retry
 * @param options - Retry options
 * @returns The result of the function if successful
 * @throws The last error if all retries fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    /** Maximum number of attempts (default: 3) */
    maxAttempts?: number;
    /** Initial delay in ms (default: 1000) */
    initialDelay?: number;
    /** Maximum delay in ms (default: 30000) */
    maxDelay?: number;
    /** Backoff multiplier (default: 2) */
    backoff?: number;
    /** Function to determine if error is retryable */
    isRetryable?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoff = 2,
    isRetryable = () => true,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !isRetryable(error)) {
        throw error;
      }

      await sleep(delay);
      delay = Math.min(delay * backoff, maxDelay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError;
}

/**
 * Creates an async function that can only have one execution in flight.
 * Subsequent calls while executing will return the existing promise.
 *
 * @param fn - The async function to deduplicate
 * @returns Function that deduplicates concurrent calls
 */
export function dedupeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): T {
  let pending: Promise<unknown> | undefined;

  return ((...args: Parameters<T>) => {
    if (pending) {
      return pending;
    }

    pending = fn(...args).finally(() => {
      pending = undefined;
    });

    return pending;
  }) as T;
}
