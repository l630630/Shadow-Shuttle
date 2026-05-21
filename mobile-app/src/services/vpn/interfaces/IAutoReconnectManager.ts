/**
 * Auto-Reconnect Manager Interface
 * 
 * Manages automatic VPN reconnection on network changes and app state changes
 */

export interface AutoReconnectConfig {
  enabled: boolean;
  reconnectOnNetworkChange: boolean;
  reconnectOnAppResume: boolean;
  maxRetries: number;
}

export interface IAutoReconnectManager {
  /**
   * Enable auto-reconnect
   * @param config - Auto-reconnect configuration
   */
  enable(config?: Partial<AutoReconnectConfig>): void;

  /**
   * Disable auto-reconnect
   */
  disable(): void;

  /**
   * Check if auto-reconnect is enabled
   * @returns True if enabled
   */
  isEnabled(): boolean;

  /**
   * Get current configuration
   * @returns Current config
   */
  getConfig(): AutoReconnectConfig;

  /**
   * Manually trigger reconnect
   * @returns Promise that resolves when reconnect completes
   */
  triggerReconnect(): Promise<void>;
}
