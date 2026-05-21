/**
 * Exponential Backoff Retry Strategy
 * 
 * Implements exponential backoff with jitter for retry delays
 */

import { IRetryStrategy, RetryOptions } from '../interfaces/IRetryStrategy';

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitterFactor: 0.3, // 30% randomness
};

export class ExponentialBackoffRetry implements IRetryStrategy {
  private options: RetryOptions;
  private currentAttempt: number = 0;

  constructor(options?: Partial<RetryOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  getDelay(attemptNumber: number): number {
    // Calculate base delay with exponential backoff
    const baseDelay = Math.min(
      this.options.initialDelay * Math.pow(this.options.backoffMultiplier, attemptNumber),
      this.options.maxDelay
    );

    // Add jitter to prevent thundering herd
    const jitter = this.calculateJitter(baseDelay);
    const delay = baseDelay + jitter;

    return Math.round(delay);
  }

  shouldRetry(attemptNumber: number): boolean {
    return attemptNumber < this.options.maxRetries;
  }

  reset(): void {
    this.currentAttempt = 0;
  }

  getOptions(): RetryOptions {
    return { ...this.options };
  }

  // MARK: - Private Methods

  private calculateJitter(baseDelay: number): number {
    // Calculate jitter range
    const jitterRange = baseDelay * this.options.jitterFactor;
    
    // Random jitter between -jitterRange and +jitterRange
    const jitter = (Math.random() * 2 - 1) * jitterRange;
    
    return jitter;
  }
}
