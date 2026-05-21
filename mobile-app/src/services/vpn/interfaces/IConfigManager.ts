/**
 * Configuration Manager Interface
 * 
 * Manages VPN configuration lifecycle: save, load, clear
 * Integrates secure storage and validation
 */

import { WireGuardConfig } from '../types/WireGuardConfig';

export interface IConfigManager {
  /**
   * Save VPN configuration to secure storage
   * @param config - WireGuard configuration to save
   * @throws {ValidationError} If config is invalid
   * @throws {StorageError} If storage operation fails
   */
  saveConfig(config: WireGuardConfig): Promise<void>;

  /**
   * Load VPN configuration from secure storage
   * @returns Saved configuration or null if not found
   * @throws {StorageError} If storage operation fails
   */
  loadConfig(): Promise<WireGuardConfig | null>;

  /**
   * Clear all VPN configuration from storage
   * @throws {StorageError} If storage operation fails
   */
  clearConfig(): Promise<void>;

  /**
   * Check if configuration exists
   * @returns True if configuration is saved
   */
  hasConfig(): Promise<boolean>;
}
