/**
 * Unit tests for MMKVStorage
 * Tests storage operations, encryption, and error handling
 */

import { MMKVStorage } from '../MMKVStorage';
import { StorageError } from '../../interfaces/ISecureStorage';

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => {
  const storages = new Map<string, Map<string, string>>();
  
  return {
    MMKV: jest.fn().mockImplementation((config: any) => {
      const id = config?.id || 'default';
      if (!storages.has(id)) {
        storages.set(id, new Map<string, string>());
      }
      const mockStorage = storages.get(id)!;
      
      return {
        set: jest.fn((key: string, value: string) => {
          mockStorage.set(key, value);
        }),
        getString: jest.fn((key: string) => {
          return mockStorage.get(key);
        }),
        delete: jest.fn((key: string) => {
          mockStorage.delete(key);
        }),
        contains: jest.fn((key: string) => {
          return mockStorage.has(key);
        }),
        clearAll: jest.fn(() => {
          mockStorage.clear();
        }),
        getAllKeys: jest.fn(() => {
          return Array.from(mockStorage.keys());
        }),
      };
    }),
  };
});

describe('MMKVStorage', () => {
  let storage: MMKVStorage;

  beforeEach(() => {
    storage = new MMKVStorage('test-storage');
    jest.clearAllMocks();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve a value', async () => {
      // Arrange
      const key = 'test-key';
      const value = { name: 'test', count: 42 };

      // Act
      await storage.set(key, value);
      const retrieved = await storage.get(key);

      // Assert
      expect(retrieved).toEqual(value);
    });

    it('should store and retrieve string values', async () => {
      // Arrange
      const key = 'string-key';
      const value = 'test string';

      // Act
      await storage.set(key, value);
      const retrieved = await storage.get<string>(key);

      // Assert
      expect(retrieved).toBe(value);
    });

    it('should store and retrieve number values', async () => {
      // Arrange
      const key = 'number-key';
      const value = 12345;

      // Act
      await storage.set(key, value);
      const retrieved = await storage.get<number>(key);

      // Assert
      expect(retrieved).toBe(value);
    });

    it('should store and retrieve boolean values', async () => {
      // Arrange
      const key = 'boolean-key';
      const value = true;

      // Act
      await storage.set(key, value);
      const retrieved = await storage.get<boolean>(key);

      // Assert
      expect(retrieved).toBe(value);
    });

    it('should store and retrieve array values', async () => {
      // Arrange
      const key = 'array-key';
      const value = [1, 2, 3, 'four', { five: 5 }];

      // Act
      await storage.set(key, value);
      const retrieved = await storage.get<any[]>(key);

      // Assert
      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      // Act
      const retrieved = await storage.get('non-existent');

      // Assert
      expect(retrieved).toBeNull();
    });
  });

  describe('Remove Operations', () => {
    it('should remove a stored value', async () => {
      // Arrange
      const key = 'remove-key';
      const value = 'test';
      await storage.set(key, value);

      // Act
      await storage.remove(key);
      const retrieved = await storage.get(key);

      // Assert
      expect(retrieved).toBeNull();
    });

    it('should not throw when removing non-existent key', async () => {
      // Act & Assert
      await expect(storage.remove('non-existent')).resolves.not.toThrow();
    });
  });

  describe('Has Operation', () => {
    it('should return true for existing key', async () => {
      // Arrange
      const key = 'exists-key';
      await storage.set(key, 'value');

      // Act
      const exists = await storage.has(key);

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      // Act
      const exists = await storage.has('non-existent');

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('Clear Operation', () => {
    it('should clear all stored values', async () => {
      // Arrange
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.set('key3', 'value3');

      // Act
      await storage.clear();

      // Assert
      expect(await storage.get('key1')).toBeNull();
      expect(await storage.get('key2')).toBeNull();
      expect(await storage.get('key3')).toBeNull();
      expect(await storage.has('key1')).toBe(false);
    });
  });

  describe('Get All Keys', () => {
    it('should return all stored keys', async () => {
      // Arrange
      const newStorage = new MMKVStorage('test-keys-storage');
      await newStorage.set('key1', 'value1');
      await newStorage.set('key2', 'value2');
      await newStorage.set('key3', 'value3');

      // Act
      const keys = await newStorage.getAllKeys();

      // Assert
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should return empty array when no keys exist', async () => {
      // Arrange - Create a fresh storage instance
      const emptyStorage = new MMKVStorage('empty-storage');
      
      // Act
      const keys = await emptyStorage.getAllKeys();

      // Assert
      expect(keys).toEqual([]);
    });
  });

  describe('Complex Data Structures', () => {
    it('should handle nested objects', async () => {
      // Arrange
      const key = 'nested-key';
      const value = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
      };

      // Act
      await storage.set(key, value);
      const retrieved = await storage.get(key);

      // Assert
      expect(retrieved).toEqual(value);
    });

    it('should handle VPN configuration object', async () => {
      // Arrange
      const key = 'vpn-config';
      const config = {
        interface: {
          privateKey: 'test-private-key',
          address: '10.0.0.2/24',
          dns: '1.1.1.1',
        },
        peer: {
          publicKey: 'test-public-key',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '0.0.0.0/0',
          persistentKeepalive: 25,
        },
      };

      // Act
      await storage.set(key, config);
      const retrieved = await storage.get(key);

      // Assert
      expect(retrieved).toEqual(config);
    });
  });

  describe('Update Operations', () => {
    it('should update existing value', async () => {
      // Arrange
      const key = 'update-key';
      await storage.set(key, 'old-value');

      // Act
      await storage.set(key, 'new-value');
      const retrieved = await storage.get(key);

      // Assert
      expect(retrieved).toBe('new-value');
    });

    it('should update complex object', async () => {
      // Arrange
      const key = 'config';
      const oldConfig = { version: 1, enabled: false };
      const newConfig = { version: 2, enabled: true };

      await storage.set(key, oldConfig);

      // Act
      await storage.set(key, newConfig);
      const retrieved = await storage.get(key);

      // Assert
      expect(retrieved).toEqual(newConfig);
    });
  });
});
