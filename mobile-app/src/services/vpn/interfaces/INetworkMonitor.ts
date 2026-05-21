/**
 * Network Monitor Interface
 * 
 * Monitors network connectivity and type changes
 */

export type NetworkType = 
  | 'wifi'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'unknown';

export interface NetworkState {
  isConnected: boolean;
  type: NetworkType;
}

export type NetworkChangeCallback = (state: NetworkState) => void;

export interface INetworkMonitor {
  /**
   * Start monitoring network changes
   * @param callback - Callback to invoke when network changes
   */
  startMonitoring(callback: NetworkChangeCallback): void;

  /**
   * Stop monitoring network changes
   */
  stopMonitoring(): void;

  /**
   * Get current network state
   * @returns Current network state
   */
  getCurrentState(): Promise<NetworkState>;

  /**
   * Check if network is connected
   * @returns True if connected
   */
  isConnected(): Promise<boolean>;
}
