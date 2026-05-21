/**
 * VPN Service Interface
 * 
 * Unified facade for all VPN operations
 */

import { VPNStatus, VPNStatusChangeListener } from './IWireGuardBridge';
import { ConnectionInfo } from './IConnectionManager';
import { AutoReconnectConfig } from './IAutoReconnectManager';
import { WireGuardConfig } from '../types/WireGuardConfig';

export interface VPNServiceConfig {
  headscaleUrl: string;
  deviceName: string;
  preAuthKey: string;
}

export interface IVPNService {
  /**
   * Register device and configure VPN
   * @param config - Service configuration
   * @returns Registration result with mesh IP
   */
  register(config: VPNServiceConfig): Promise<{ meshIP: string; nodeId: string }>;

  /**
   * Connect to VPN (uses saved configuration)
   * @throws {Error} If no configuration exists or connection fails
   */
  connect(): Promise<void>;

  /**
   * Disconnect from VPN
   * @throws {Error} If disconnection fails
   */
  disconnect(): Promise<void>;

  /**
   * Get current VPN status
   * @returns Current status
   */
  getStatus(): Promise<VPNStatus>;

  /**
   * Get detailed connection information
   * @returns Connection info
   */
  getConnectionInfo(): ConnectionInfo;

  /**
   * Check if VPN is connected
   * @returns True if connected
   */
  isConnected(): boolean;

  /**
   * Check if VPN is configured
   * @returns True if configuration exists
   */
  isConfigured(): Promise<boolean>;

  /**
   * Get saved configuration
   * @returns Saved configuration or null
   */
  getConfiguration(): Promise<WireGuardConfig | null>;

  /**
   * Clear saved configuration
   */
  clearConfiguration(): Promise<void>;

  /**
   * Enable auto-reconnect
   * @param config - Auto-reconnect configuration
   */
  enableAutoReconnect(config?: Partial<AutoReconnectConfig>): void;

  /**
   * Disable auto-reconnect
   */
  disableAutoReconnect(): void;

  /**
   * Check if auto-reconnect is enabled
   * @returns True if enabled
   */
  isAutoReconnectEnabled(): boolean;

  /**
   * Add listener for status changes
   * @param listener - Callback to invoke when status changes
   * @returns Subscription object with remove() method
   */
  addStatusChangeListener(listener: VPNStatusChangeListener): { remove: () => void };

  /**
   * Remove all status change listeners
   */
  removeAllListeners(): void;
}
