/**
 * Exponential Backoff Retry Unit Tests
 */

import { ExponentialBackoffRetry } from '../ExponentialBackoffRetry';

describe('ExponentialBackoffRetry', () => {
  describe('Default options', () => {
    let strategy: ExponentialBackoffRetry;

    beforeEach(() => {
      strategy = new ExponentialBackoffRetry();
    });

    it('should use default options', () => {
      const options = strategy.getOptions();

      expect(options.maxRetries).toBe(5);
      expect(options.initialDelay).toBe(1000);
      expect(options.maxDelay).toBe(30000);
      expect(options.backoffMultiplier).toBe(2);
      expect(options.jitterFactor).toBe(0.3);
    });

    it('should calculate exponential delays', () => {
      const delay0 = strategy.getDelay(0);
      const delay1 = strategy.getDelay(1);
      const delay2 = strategy.getDelay(2);

      // Delays should increase exponentially (with jitter)
      expect(delay0).toBeGreaterThanOrEqual(700); // 1000 - 30%
      expect(delay0).toBeLessThanOrEqual(1300); // 1000 + 30%

      expect(delay1).toBeGreaterThanOrEqual(1400); // 2000 - 30%
      expect(delay1).toBeLessThanOrEqual(2600); // 2000 + 30%

      expect(delay2).toBeGreaterThanOrEqual(2800); // 4000 - 30%
      expect(delay2).toBeLessThanOrEqual(5200); // 4000 + 30%
    });

    it('should respect max delay', () => {
      // Attempt 10 should exceed max delay
      const delay = strategy.getDelay(10);

      expect(delay).toBeLessThanOrEqual(30000 * 1.3); // Max + jitter
    });

    it('should allow retries up to max', () => {
      expect(strategy.shouldRetry(0)).toBe(true);
      expect(strategy.shouldRetry(4)).toBe(true);
      expect(strategy.shouldRetry(5)).toBe(false);
      expect(strategy.shouldRetry(10)).toBe(false);
    });

    it('should reset state', () => {
      strategy.reset();
      expect(strategy.shouldRetry(0)).toBe(true);
    });
  });

  describe('Custom options', () => {
    it('should use custom max retries', () => {
      const strategy = new ExponentialBackoffRetry({ maxRetries: 3 });

      expect(strategy.shouldRetry(2)).toBe(true);
      expect(strategy.shouldRetry(3)).toBe(false);
    });

    it('should use custom initial delay', () => {
      const strategy = new ExponentialBackoffRetry({ 
        initialDelay: 500,
        jitterFactor: 0, // No jitter for predictable testing
      });

      const delay = strategy.getDelay(0);
      expect(delay).toBe(500);
    });

    it('should use custom backoff multiplier', () => {
      const strategy = new ExponentialBackoffRetry({ 
        initialDelay: 1000,
        backoffMultiplier: 3,
        jitterFactor: 0,
      });

      expect(strategy.getDelay(0)).toBe(1000);
      expect(strategy.getDelay(1)).toBe(3000);
      expect(strategy.getDelay(2)).toBe(9000);
    });

    it('should use custom max delay', () => {
      const strategy = new ExponentialBackoffRetry({ 
        initialDelay: 1000,
        maxDelay: 5000,
        jitterFactor: 0,
      });

      const delay = strategy.getDelay(10);
      expect(delay).toBe(5000);
    });

    it('should use custom jitter factor', () => {
      const strategy = new ExponentialBackoffRetry({ 
        initialDelay: 1000,
        jitterFactor: 0.5, // 50% jitter
      });

      const delays = Array.from({ length: 100 }, () => strategy.getDelay(0));
      
      // All delays should be within jitter range
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(500); // 1000 - 50%
        expect(delay).toBeLessThanOrEqual(1500); // 1000 + 50%
      });
    });
  });

  describe('Jitter behavior', () => {
    it('should add randomness to delays', () => {
      const strategy = new ExponentialBackoffRetry({ 
        initialDelay: 1000,
        jitterFactor: 0.3,
      });

      // Generate multiple delays for same attempt
      const delays = Array.from({ length: 100 }, () => strategy.getDelay(0));

      // Delays should vary
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(50); // At least 50% unique

      // All delays should be within jitter range
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(700);
        expect(delay).toBeLessThanOrEqual(1300);
      });
    });

    it('should work with zero jitter', () => {
      const strategy = new ExponentialBackoffRetry({ 
        initialDelay: 1000,
        jitterFactor: 0,
      });

      const delay1 = strategy.getDelay(0);
      const delay2 = strategy.getDelay(0);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(1000);
    });
  });

  describe('Edge cases', () => {
    it('should handle attempt 0', () => {
      const strategy = new ExponentialBackoffRetry();
      
      expect(strategy.shouldRetry(0)).toBe(true);
      expect(strategy.getDelay(0)).toBeGreaterThan(0);
    });

    it('should handle large attempt numbers', () => {
      const strategy = new ExponentialBackoffRetry();
      
      const delay = strategy.getDelay(100);
      expect(delay).toBeLessThanOrEqual(30000 * 1.3);
    });

    it('should handle negative attempt numbers gracefully', () => {
      const strategy = new ExponentialBackoffRetry();
      
      // Should not throw
      expect(() => strategy.getDelay(-1)).not.toThrow();
      expect(() => strategy.shouldRetry(-1)).not.toThrow();
    });
  });

  describe('Retry sequence', () => {
    it('should produce increasing delays', () => {
      const strategy = new ExponentialBackoffRetry({ 
        jitterFactor: 0, // No jitter for predictable testing
      });

      const delays = [0, 1, 2, 3, 4].map(i => strategy.getDelay(i));

      // Each delay should be greater than or equal to previous
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
      }
    });

    it('should respect max retries in sequence', () => {
      const strategy = new ExponentialBackoffRetry({ maxRetries: 3 });

      const results = [0, 1, 2, 3, 4].map(i => strategy.shouldRetry(i));

      expect(results).toEqual([true, true, true, false, false]);
    });
  });
});
