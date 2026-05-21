/**
 * MMKV Storage Implementation
 * 
 * Fast, encrypted storage using react-native-mmkv for VPN configuration.
 * MMKV is faster than AsyncStorage and supports encryption out of the box.
 */

import { MMKV } from 'react-native-mmkv';
import { ISecureStorage, StorageOptions, StorageError } from '../interfaces/ISecureStorage';

export class MMKVStorage implements ISecureStorage {
  private storage: MMKV;

  constructor(id: string = 'vpn-config', encryptionKey?: string) {
    try {
      this.storage = new MMKV({
        id,
        encryptionKey,
      });
    } catch (error) {
      throw new StorageError('Failed to initialize MMKV storage', error as Error);
    }
  }

  async set(key: string, value: any, options?: StorageOptions): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      this.storage.set(key, serialized);
    } catch (error) {
      throw new StorageError(`Failed to set value for key '${key}'`, error as Error);
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
      throw new StorageError(`Failed to get value for key '${key}'`, error as Error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.storage.delete(key);
    } catch (error) {
      throw new StorageError(`Failed to remove key '${key}'`, error as Error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return this.storage.contains(key);
    } catch (error) {
      throw new StorageError(`Failed to check key '${key}'`, error as Error);
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.clearAll();
    } catch (error) {
      throw new StorageError('Failed to clear storage', error as Error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return this.storage.getAllKeys();
    } catch (error) {
      throw new StorageError('Failed to get all keys', error as Error);
    }
  }
}
