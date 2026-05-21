/**
 * Secure Storage Interface
 * 
 * Abstraction for secure data storage with encryption support.
 * Provides separate storage for configuration and sensitive data.
 */

export interface StorageOptions {
  encrypt?: boolean; // Whether to encrypt the data
}

export class StorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

export interface ISecureStorage {
  /**
   * Store a value
   * @param key - Storage key
   * @param value - Value to store (will be JSON stringified)
   * @param options - Storage options
   */
  set(key: string, value: any, options?: StorageOptions): Promise<void>;

  /**
   * Retrieve a value
   * @param key - Storage key
   * @returns The stored value or null if not found
   */
  get<T = any>(key: string): Promise<T | null>;

  /**
   * Remove a value
   * @param key - Storage key
   */
  remove(key: string): Promise<void>;

  /**
   * Check if a key exists
   * @param key - Storage key
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all stored data
   */
  clear(): Promise<void>;

  /**
   * Get all keys
   */
  getAllKeys(): Promise<string[]>;
}
