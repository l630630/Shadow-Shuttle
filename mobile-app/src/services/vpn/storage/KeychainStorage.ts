/**
 * Keychain Storage Implementation
 * 
 * Secure storage for sensitive data (private keys, passwords) using platform keychain.
 * - iOS: Uses Keychain Services
 * - Android: Uses Keystore
 * 
 * Note: This is a wrapper around react-native-mmkv with encryption for now.
 * In production, consider using @react-native-community/keychain for true keychain access.
 */

import { MMKV } from 'react-native-mmkv';
import { ISecureStorage, StorageOptions, StorageError } from '../interfaces/ISecureStorage';

export class KeychainStorage implements ISecureStorage {
  private storage: MMKV;
  private readonly ENCRYPTION_KEY = 'vpn-keychain-encryption-key'; // In production, use secure key generation

  constructor() {
    try {
      // Use encrypted MMKV for sensitive data
      this.storage = new MMKV({
        id: 'vpn-keychain',
        encryptionKey: this.ENCRYPTION_KEY,
      });
    } catch (error) {
      throw new StorageError('Failed to initialize Keychain storage', error as Error);
    }
  }

  async set(key: string, value: any, options?: StorageOptions): Promise<void> {
    try {
      // Always encrypt sensitive data
      const serialized = JSON.stringify(value);
      this.storage.set(key, serialized);
    } catch (error) {
      throw new StorageError(`Failed to set secure value for key '${key}'`, error as Error);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = this.storage.getString(key);
      if (value === undefined) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      throw new StorageError(`Failed to get secure value for key '${key}'`, error as Error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.storage.delete(key);
    } catch (error) {
      throw new StorageError(`Failed to remove secure key '${key}'`, error as Error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return this.storage.contains(key);
    } catch (error) {
      throw new StorageError(`Failed to check secure key '${key}'`, error as Error);
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.clearAll();
    } catch (error) {
      throw new StorageError('Failed to clear secure storage', error as Error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return this.storage.getAllKeys();
    } catch (error) {
      throw new StorageError('Failed to get all secure keys', error as Error);
    }
  }

  /**
   * Store a private key securely
   * @param keyName - Name/identifier for the key
   * @param privateKey - The private key to store
   */
  async storePrivateKey(keyName: string, privateKey: string): Promise<void> {
    await this.set(`privateKey:${keyName}`, privateKey);
  }

  /**
   * Retrieve a private key
   * @param keyName - Name/identifier for the key
   */
  async getPrivateKey(keyName: string): Promise<string | null> {
    return this.get<string>(`privateKey:${keyName}`);
  }

  /**
   * Remove a private key
   * @param keyName - Name/identifier for the key
   */
  async removePrivateKey(keyName: string): Promise<void> {
    await this.remove(`privateKey:${keyName}`);
  }
}
