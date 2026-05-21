/**
 * Configuration Manager Implementation
 * 
 * Manages VPN configuration lifecycle with validation and secure storage
 */

import { IConfigManager } from '../interfaces/IConfigManager';
import { ISecureStorage } from '../interfaces/ISecureStorage';
import { IConfigValidator } from '../interfaces/IConfigValidator';
import { WireGuardConfig } from '../types/WireGuardConfig';

const CONFIG_KEY = 'vpn_config';

export class ConfigManager implements IConfigManager {
  constructor(
    private storage: ISecureStorage,
    private validator: IConfigValidator
  ) {}

  async saveConfig(config: WireGuardConfig): Promise<void> {
    // Validate configuration before saving
    const errors = this.validator.validate(config);
    if (errors.length > 0) {
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }

    // Save to secure storage
    await this.storage.set(CONFIG_KEY, JSON.stringify(config));
  }

  async loadConfig(): Promise<WireGuardConfig | null> {
    const configStr = await this.storage.get(CONFIG_KEY);
    
    if (!configStr) {
      return null;
    }

    try {
      const config = JSON.parse(configStr) as WireGuardConfig;
      
      // Validate loaded configuration
      const errors = this.validator.validate(config);
      if (errors.length > 0) {
        console.warn('Loaded configuration is invalid:', errors);
        // Clear invalid configuration
        await this.clearConfig();
        return null;
      }

      return config;
    } catch (error) {
      console.error('Failed to parse configuration:', error);
      // Clear corrupted configuration
      await this.clearConfig();
      return null;
    }
  }

  async clearConfig(): Promise<void> {
    await this.storage.delete(CONFIG_KEY);
  }

  async hasConfig(): Promise<boolean> {
    const config = await this.loadConfig();
    return config !== null;
  }
}
