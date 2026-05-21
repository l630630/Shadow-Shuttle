/**
 * Retry Strategy Interface
 * 
 * Defines retry behavior for failed operations
 */

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitterFactor: number; // 0-1, amount of randomness
}

export interface IRetryStrategy {
  /**
   * Calculate delay for next retry attempt
   * @param attemptNumber - Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  getDelay(attemptNumber: number): number;

  /**
   * Check if should retry based on attempt number
   * @param attemptNumber - Current attempt number (0-indexed)
   * @returns True if should retry
   */
  shouldRetry(attemptNumber: number): boolean;

  /**
   * Reset retry state
   */
  reset(): void;

  /**
   * Get current retry options
   * @returns Retry options
   */
  getOptions(): RetryOptions;
}
