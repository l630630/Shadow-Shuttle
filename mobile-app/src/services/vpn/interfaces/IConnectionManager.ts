/**
 * Connection Manager Interface
 * 
 * Manages VPN connection lifecycle and state
 */

import { VPNStatus, VPNStatusChangeListener } from './IWireGuardBridge';

export interface ConnectionInfo {
  status: VPNStatus;
  connectedAt?: Date;
  disconnectedAt?: Date;
  meshIP?: string;
}

export interface IConnectionManager {
  /**
   * Connect to VPN
   * @throws {Error} If connection fails
   */
  connect(): Promise<void>;

  /**
   * Disconnect from VPN
   * @throws {Error} If disconnection fails
   */
  disconnect(): Promise<void>;

  /**
   * Get current connection status
   * @returns Current status
   */
  getStatus(): Promise<VPNStatus>;

  /**
   * Get detailed connection information
   * @returns Connection info
   */
  getConnectionInfo(): ConnectionInfo;

  /**
   * Check if currently connected
   * @returns True if connected
   */
  isConnected(): boolean;

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
