/**
 * Unit tests for KeychainStorage
 * Tests secure storage operations for sensitive data
 */

import { KeychainStorage } from '../KeychainStorage';
import { StorageError } from '../../interfaces/ISecureStorage';

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => {
  const mockStorage = new Map<string, string>();
  
  return {
    MMKV: jest.fn().mockImplementation(() => ({
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
    })),
  };
});

describe('KeychainStorage', () => {
  let storage: KeychainStorage;

  beforeEach(() => {
    storage = new KeychainStorage();
    jest.clearAllMocks();
  });

  describe('Basic Secure Operations', () => {
    it('should store and retrieve sensitive data', async () => {
      // Arrange
      const key = 'api-token';
      const value = 'secret-token-12345';

      // Act
      await storage.set(key, value);
      const retrieved = await storage.get<string>(key);

      // Assert
      expect(retrieved).toBe(value);
    });

    it('should store and retrieve encrypted credentials', async () => {
      // Arrange
      const key = 'credentials';
      const credentials = {
        username: 'user@example.com',
        password: 'super-secret-password',
      };

      // Act
      await storage.set(key, credentials);
      const retrieved = await storage.get(key);

      // Assert
      expect(retrieved).toEqual(credentials);
    });

    it('should return null for non-existent secure key', async () => {
      // Act
      const retrieved = await storage.get('non-existent');

      // Assert
      expect(retrieved).toBeNull();
    });
  });

  describe('Private Key Operations', () => {
    it('should store and retrieve private key', async () => {
      // Arrange
      const keyName = 'wireguard';
      const privateKey = 'wG1234567890abcdefghijklmnopqrstuvwxyz=';

      // Act
      await storage.storePrivateKey(keyName, privateKey);
      const retrieved = await storage.getPrivateKey(keyName);

      // Assert
      expect(retrieved).toBe(privateKey);
    });

    it('should remove private key', async () => {
      // Arrange
      const keyName = 'wireguard';
      const privateKey = 'test-private-key';
      await storage.storePrivateKey(keyName, privateKey);

      // Act
      await storage.removePrivateKey(keyName);
      const retrieved = await storage.getPrivateKey(keyName);

      // Assert
      expect(retrieved).toBeNull();
    });

    it('should return null for non-existent private key', async () => {
      // Act
      const retrieved = await storage.getPrivateKey('non-existent');

      // Assert
      expect(retrieved).toBeNull();
    });

    it('should store multiple private keys', async () => {
      // Arrange
      const keys = {
        wireguard: 'wg-private-key',
        ssh: 'ssh-private-key',
        tls: 'tls-private-key',
      };

      // Act
      await storage.storePrivateKey('wireguard', keys.wireguard);
      await storage.storePrivateKey('ssh', keys.ssh);
      await storage.storePrivateKey('tls', keys.tls);

      // Assert
      expect(await storage.getPrivateKey('wireguard')).toBe(keys.wireguard);
      expect(await storage.getPrivateKey('ssh')).toBe(keys.ssh);
      expect(await storage.getPrivateKey('tls')).toBe(keys.tls);
    });
  });

  describe('Remove Operations', () => {
    it('should remove sensitive data', async () => {
      // Arrange
      const key = 'token';
      await storage.set(key, 'secret-token');

      // Act
      await storage.remove(key);
      const retrieved = await storage.get(key);

      // Assert
      expect(retrieved).toBeNull();
    });
  });

  describe('Has Operation', () => {
    it('should check if secure key exists', async () => {
      // Arrange
      const key = 'secure-key';
      await storage.set(key, 'secure-value');

      // Act
      const exists = await storage.has(key);

      // Assert
      expect(exists).toBe(true);
    });

    it('should return false for non-existent secure key', async () => {
      // Act
      const exists = await storage.has('non-existent');

      // Assert
      expect(exists).toBe(false);
    });
  });

  describe('Clear Operation', () => {
    it('should clear all sensitive data', async () => {
      // Arrange
      await storage.set('token1', 'secret1');
      await storage.set('token2', 'secret2');
      await storage.storePrivateKey('key1', 'private-key-1');

      // Act
      await storage.clear();

      // Assert
      expect(await storage.get('token1')).toBeNull();
      expect(await storage.get('token2')).toBeNull();
      expect(await storage.getPrivateKey('key1')).toBeNull();
    });
  });

  describe('Data Isolation', () => {
    it('should isolate private keys from regular storage', async () => {
      // Arrange
      const keyName = 'test';
      const privateKey = 'private-key-value';
      const regularValue = 'regular-value';

      // Act
      await storage.storePrivateKey(keyName, privateKey);
      await storage.set(keyName, regularValue);

      // Assert
      expect(await storage.getPrivateKey(keyName)).toBe(privateKey);
      expect(await storage.get(keyName)).toBe(regularValue);
      // They should be stored under different keys
    });

    it('should list all keys including private keys', async () => {
      // Arrange
      await storage.set('config', 'value');
      await storage.storePrivateKey('wg', 'private-key');

      // Act
      const keys = await storage.getAllKeys();

      // Assert
      expect(keys).toContain('config');
      expect(keys).toContain('privateKey:wg');
    });
  });

  describe('Sensitive Data Handling', () => {
    it('should handle WireGuard configuration with private key', async () => {
      // Arrange
      const config = {
        interface: {
          address: '10.0.0.2/24',
          dns: '1.1.1.1',
        },
        peer: {
          publicKey: 'peer-public-key',
          endpoint: 'vpn.example.com:51820',
        },
      };
      const privateKey = 'interface-private-key';

      // Act
      await storage.set('vpn-config', config);
      await storage.storePrivateKey('vpn', privateKey);

      // Assert
      const retrievedConfig = await storage.get('vpn-config');
      const retrievedKey = await storage.getPrivateKey('vpn');
      
      expect(retrievedConfig).toEqual(config);
      expect(retrievedKey).toBe(privateKey);
    });

    it('should handle API keys and tokens', async () => {
      // Arrange
      const apiKeys = {
        headscale: 'headscale-api-key',
        preAuth: 'pre-auth-key-12345',
      };

      // Act
      await storage.set('api-keys', apiKeys);
      const retrieved = await storage.get('api-keys');

      // Assert
      expect(retrieved).toEqual(apiKeys);
    });
  });
});
