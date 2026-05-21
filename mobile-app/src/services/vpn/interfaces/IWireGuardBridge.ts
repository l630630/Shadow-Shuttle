/**
 * WireGuard Bridge Interface
 * 
 * Type-safe wrapper around native WireGuard module
 */

export type VPNStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'reasserting'
  | 'invalid';

export interface VPNStatusChangeEvent {
  status: VPNStatus;
}

export type VPNStatusChangeListener = (event: VPNStatusChangeEvent) => void;

export interface IWireGuardBridge {
  /**
   * Connect to VPN with configuration
   * @param configString - WireGuard configuration in INI format
   * @throws {Error} If connection fails
   */
  connect(configString: string): Promise<void>;

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
