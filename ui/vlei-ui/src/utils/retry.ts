/**
 * Retry utility function for polling operations with exponential backoff support
 * 
 * @param operation - The async operation to retry
 * @param options - Configuration options for the retry behavior
 * @returns Promise that resolves with the operation result or rejects after timeout
 * 
 * @example
 * ```typescript
 * const result = await eventually(
 *   () => checkSomething(),
 *   { timeout: 5000, interval: 100, description: 'Check operation' }
 * );
 * ```
 */
export async function eventually<T>(
  operation: () => Promise<T>,
  options: {
    /** Maximum time to wait in milliseconds (default: 3000) */
    timeout?: number;
    /** Interval between retries in milliseconds (default: 100) */
    interval?: number;
    /** Description for error messages (default: 'operation') */
    description?: string;
    /** Whether to use exponential backoff (default: false) */
    exponentialBackoff?: boolean;
    /** Maximum interval for exponential backoff in milliseconds (default: 1000) */
    maxInterval?: number;
  } = {}
): Promise<T> {
  const { 
    timeout = 3000, 
    interval = 100, 
    description = 'operation',
    exponentialBackoff = false,
    maxInterval = 1000
  } = options;
  
  const startTime = Date.now();
  let currentInterval = interval;
  let attemptCount = 0;
  
  while (Date.now() - startTime < timeout) {
    try {
      attemptCount++;
      const result = await operation();
      return result;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      
      // Check if we're about to exceed the timeout
      if (elapsed + currentInterval >= timeout) {
        throw new Error(
          `${description} timed out after ${timeout}ms (${attemptCount} attempts): ${error.message}`
        );
      }
      
      // Wait before the next attempt
      await new Promise(resolve => setTimeout(resolve, currentInterval));
      
      // Apply exponential backoff if enabled
      if (exponentialBackoff) {
        currentInterval = Math.min(currentInterval * 2, maxInterval);
      }
    }
  }
  
  throw new Error(`${description} timed out after ${timeout}ms (${attemptCount} attempts)`);
}

/**
 * Creates a promise that rejects after the specified timeout
 * Useful for adding timeouts to operations that don't have built-in timeout support
 * 
 * @param ms - Timeout in milliseconds
 * @param message - Optional error message
 * @returns Promise that rejects after timeout
 */
export function createTimeout(ms: number, message?: string): Promise<never> {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(message || `Operation timed out after ${ms}ms`)), ms)
  );
}

/**
 * Adds a timeout to any promise
 * 
 * @param promise - The promise to add timeout to
 * @param ms - Timeout in milliseconds
 * @param message - Optional error message
 * @returns Promise that resolves with the original promise or rejects on timeout
 */
export function withTimeout<T>(
  promise: Promise<T>, 
  ms: number, 
  message?: string
): Promise<T> {
  return Promise.race([
    promise,
    createTimeout(ms, message)
  ]);
}