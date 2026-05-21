/**
 * Config Manager Unit Tests
 */

import { ConfigManager } from '../ConfigManager';
import { ISecureStorage } from '../../interfaces/ISecureStorage';
import { IConfigValidator } from '../../interfaces/IConfigValidator';
import { WireGuardConfig } from '../../types/WireGuardConfig';

// Mock implementations
class MockStorage implements ISecureStorage {
  private data = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  // Test helper
  reset() {
    this.data.clear();
  }
}

class MockValidator implements IConfigValidator {
  private shouldFail = false;
  private errorMessages: string[] = [];

  validate(config: WireGuardConfig): string[] {
    if (this.shouldFail) {
      return this.errorMessages;
    }
    return [];
  }

  // Test helpers
  setValidationResult(shouldFail: boolean, errors: string[] = []) {
    this.shouldFail = shouldFail;
    this.errorMessages = errors;
  }
}

describe('ConfigManager', () => {
  let storage: MockStorage;
  let validator: MockValidator;
  let manager: ConfigManager;

  const validConfig: WireGuardConfig = {
    interface: {
      privateKey: 'cGVlcjEtcHJpdmF0ZS1rZXk=',
      address: '10.0.0.2/24',
      dns: '1.1.1.1',
    },
    peers: [
      {
        publicKey: 'c2VydmVyLXB1YmxpYy1rZXk=',
        endpoint: 'vpn.example.com:51820',
        allowedIPs: '0.0.0.0/0',
        persistentKeepalive: 25,
      },
    ],
  };

  beforeEach(() => {
    storage = new MockStorage();
    validator = new MockValidator();
    manager = new ConfigManager(storage, validator);
  });

  describe('saveConfig', () => {
    it('should save valid configuration', async () => {
      await manager.saveConfig(validConfig);
      
      const saved = await storage.get('vpn_config');
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved!)).toEqual(validConfig);
    });

    it('should throw error for invalid configuration', async () => {
      validator.setValidationResult(true, ['Invalid address']);

      await expect(manager.saveConfig(validConfig)).rejects.toThrow(
        'Invalid configuration: Invalid address'
      );
    });

    it('should not save if validation fails', async () => {
      validator.setValidationResult(true, ['Invalid address']);

      try {
        await manager.saveConfig(validConfig);
      } catch (error) {
        // Expected
      }

      const saved = await storage.get('vpn_config');
      expect(saved).toBeNull();
    });
  });

  describe('loadConfig', () => {
    it('should load saved configuration', async () => {
      await manager.saveConfig(validConfig);
      
      const loaded = await manager.loadConfig();
      expect(loaded).toEqual(validConfig);
    });

    it('should return null if no configuration exists', async () => {
      const loaded = await manager.loadConfig();
      expect(loaded).toBeNull();
    });

    it('should clear and return null for invalid configuration', async () => {
      // Save valid config first
      await manager.saveConfig(validConfig);
      
      // Make validator fail on load
      validator.setValidationResult(true, ['Invalid on load']);
      
      const loaded = await manager.loadConfig();
      expect(loaded).toBeNull();
      
      // Verify config was cleared
      const saved = await storage.get('vpn_config');
      expect(saved).toBeNull();
    });

    it('should clear and return null for corrupted configuration', async () => {
      // Manually save corrupted data
      await storage.set('vpn_config', 'invalid-json{');
      
      const loaded = await manager.loadConfig();
      expect(loaded).toBeNull();
      
      // Verify config was cleared
      const saved = await storage.get('vpn_config');
      expect(saved).toBeNull();
    });
  });

  describe('clearConfig', () => {
    it('should clear saved configuration', async () => {
      await manager.saveConfig(validConfig);
      await manager.clearConfig();
      
      const loaded = await manager.loadConfig();
      expect(loaded).toBeNull();
    });

    it('should not throw if no configuration exists', async () => {
      await expect(manager.clearConfig()).resolves.not.toThrow();
    });
  });

  describe('hasConfig', () => {
    it('should return true if configuration exists', async () => {
      await manager.saveConfig(validConfig);
      
      const has = await manager.hasConfig();
      expect(has).toBe(true);
    });

    it('should return false if no configuration exists', async () => {
      const has = await manager.hasConfig();
      expect(has).toBe(false);
    });

    it('should return false if configuration is invalid', async () => {
      await manager.saveConfig(validConfig);
      
      // Make validator fail
      validator.setValidationResult(true, ['Invalid']);
      
      const has = await manager.hasConfig();
      expect(has).toBe(false);
    });
  });

  describe('Property: Configuration round-trip', () => {
    it('should preserve configuration after save and load', async () => {
      await manager.saveConfig(validConfig);
      const loaded = await manager.loadConfig();
      
      expect(loaded).toEqual(validConfig);
    });

    it('should handle multiple save/load cycles', async () => {
      for (let i = 0; i < 5; i++) {
        await manager.saveConfig(validConfig);
        const loaded = await manager.loadConfig();
        expect(loaded).toEqual(validConfig);
      }
    });
  });

  describe('Property: Clear completeness', () => {
    it('should not be able to load after clear', async () => {
      await manager.saveConfig(validConfig);
      await manager.clearConfig();
      
      const loaded = await manager.loadConfig();
      expect(loaded).toBeNull();
    });

    it('should handle multiple clear operations', async () => {
      await manager.saveConfig(validConfig);
      await manager.clearConfig();
      await manager.clearConfig();
      await manager.clearConfig();
      
      const loaded = await manager.loadConfig();
      expect(loaded).toBeNull();
    });
  });
});
