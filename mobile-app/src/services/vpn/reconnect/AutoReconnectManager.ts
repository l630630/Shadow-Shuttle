/**
 * Auto-Reconnect Manager Implementation
 * 
 * Handles automatic VPN reconnection on network and app state changes
 */

import { AppState, AppStateStatus } from 'react-native';
import { IAutoReconnectManager, AutoReconnectConfig } from '../interfaces/IAutoReconnectManager';
import { IConnectionManager } from '../interfaces/IConnectionManager';
import { INetworkMonitor, NetworkState } from '../interfaces/INetworkMonitor';
import { IRetryStrategy } from '../interfaces/IRetryStrategy';

const DEFAULT_CONFIG: AutoReconnectConfig = {
  enabled: false,
  reconnectOnNetworkChange: true,
  reconnectOnAppResume: true,
  maxRetries: 3,
};

export class AutoReconnectManager implements IAutoReconnectManager {
  private config: AutoReconnectConfig = { ...DEFAULT_CONFIG };
  private isReconnecting = false;
  private appStateSubscription: any = null;
  private lastNetworkType: string | null = null;
  private wasConnectedBeforeBackground = false;

  constructor(
    private connectionManager: IConnectionManager,
    private networkMonitor: INetworkMonitor,
    private retryStrategy: IRetryStrategy
  ) {}

  enable(config?: Partial<AutoReconnectConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config, enabled: true };

    // Start monitoring network changes
    if (this.config.reconnectOnNetworkChange) {
      this.networkMonitor.startMonitoring((state) => {
        this.handleNetworkChange(state);
      });
    }

    // Start monitoring app state changes
    if (this.config.reconnectOnAppResume) {
      this.appStateSubscription = AppState.addEventListener('change', (state) => {
        this.handleAppStateChange(state);
      });
    }

    console.log('Auto-reconnect enabled:', this.config);
  }

  disable(): void {
    this.config.enabled = false;

    // Stop monitoring
    this.networkMonitor.stopMonitoring();

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    console.log('Auto-reconnect disabled');
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getConfig(): AutoReconnectConfig {
    return { ...this.config };
  }

  async triggerReconnect(): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Auto-reconnect is not enabled');
    }

    await this.performReconnect();
  }

  // MARK: - Private Methods

  private async handleNetworkChange(state: NetworkState): Promise<void> {
    if (!this.config.enabled || !this.config.reconnectOnNetworkChange) {
      return;
    }

    // Check if network type changed
    const currentType = state.type;
    const typeChanged = this.lastNetworkType !== null && this.lastNetworkType !== currentType;
    this.lastNetworkType = currentType;

    // Only reconnect if:
    // 1. Network type changed (e.g., WiFi -> Cellular)
    // 2. Network is now connected
    // 3. VPN was connected before
    if (typeChanged && state.isConnected) {
      const isConnected = this.connectionManager.isConnected();
      
      if (isConnected) {
        console.log(`Network changed to ${currentType}, triggering reconnect`);
        await this.performReconnect();
      }
    }

    // If network disconnected, just log
    if (!state.isConnected) {
      console.log('Network disconnected');
    }
  }

  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    if (!this.config.enabled || !this.config.reconnectOnAppResume) {
      return;
    }

    // App going to background
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.wasConnectedBeforeBackground = this.connectionManager.isConnected();
      console.log('App going to background, VPN connected:', this.wasConnectedBeforeBackground);
    }

    // App coming to foreground
    if (nextAppState === 'active') {
      console.log('App resumed to foreground');

      // Only reconnect if VPN was connected before background
      if (this.wasConnectedBeforeBackground) {
        const isCurrentlyConnected = this.connectionManager.isConnected();

        // If VPN is not connected now, try to reconnect
        if (!isCurrentlyConnected) {
          console.log('VPN disconnected while in background, triggering reconnect');
          await this.performReconnect();
        } else {
          console.log('VPN still connected');
        }
      }
    }
  }

  private async performReconnect(): Promise<void> {
    if (this.isReconnecting) {
      console.log('Reconnect already in progress, skipping');
      return;
    }

    this.isReconnecting = true;
    this.retryStrategy.reset();

    let attempt = 0;
    let success = false;

    while (this.retryStrategy.shouldRetry(attempt) && !success) {
      try {
        console.log(`Reconnect attempt ${attempt + 1}/${this.config.maxRetries}`);

        // Disconnect first if connected
        try {
          const status = await this.connectionManager.getStatus();
          if (status === 'connected' || status === 'connecting') {
            await this.connectionManager.disconnect();
            // Wait a bit for clean disconnect
            await this.sleep(500);
          }
        } catch (error) {
          console.warn('Failed to disconnect before reconnect:', error);
        }

        // Try to connect
        await this.connectionManager.connect();
        
        success = true;
        console.log('Reconnect successful');
      } catch (error) {
        console.error(`Reconnect attempt ${attempt + 1} failed:`, error);

        // Check if should retry
        if (this.retryStrategy.shouldRetry(attempt + 1)) {
          const delay = this.retryStrategy.getDelay(attempt);
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }

        attempt++;
      }
    }

    this.isReconnecting = false;

    if (!success) {
      console.error('All reconnect attempts failed');
      // TODO: Notify user about reconnection failure
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
