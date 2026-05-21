/**
 * VPN Service Implementation
 * 
 * Unified facade that coordinates all VPN subsystems
 */

import { IVPNService, VPNServiceConfig } from './interfaces/IVPNService';
import { IHeadscaleClient } from './interfaces/IHeadscaleClient';
import { IConfigManager } from './interfaces/IConfigManager';
import { IConnectionManager } from './interfaces/IConnectionManager';
import { IAutoReconnectManager, AutoReconnectConfig } from './interfaces/IAutoReconnectManager';
import { VPNStatus, VPNStatusChangeListener } from './interfaces/IWireGuardBridge';
import { ConnectionInfo } from './interfaces/IConnectionManager';
import { WireGuardConfig } from './types/WireGuardConfig';
import { ErrorRecoveryManager } from './errors/ErrorRecoveryManager';
import { VPNLogger } from './logging/VPNLogger';
import { VPNMetrics } from './metrics/VPNMetrics';
import { toVPNError } from './errors/VPNErrors';

export class VPNService implements IVPNService {
  constructor(
    private headscaleClient: IHeadscaleClient,
    private configManager: IConfigManager,
    private connectionManager: IConnectionManager,
    private autoReconnectManager: IAutoReconnectManager,
    private errorManager?: ErrorRecoveryManager,
    private logger?: VPNLogger,
    private metrics?: VPNMetrics
  ) {
    this.logger?.info('VPN', 'VPNService initialized');
  }

  async register(config: VPNServiceConfig): Promise<{ meshIP: string; nodeId: string }> {
    this.logger?.info('VPN', 'Starting device registration', { deviceName: config.deviceName });
    
    // Validate input
    if (!config.headscaleUrl || !config.deviceName || !config.preAuthKey) {
      const error = new Error('Missing required configuration parameters');
      this.logger?.error('VPN', 'Registration validation failed', { error });
      throw error;
    }

    try {
      // Register device with Headscale
      this.logger?.debug('VPN', 'Registering device with Headscale');
      const result = await this.headscaleClient.registerDevice({
        baseUrl: config.headscaleUrl,
        deviceName: config.deviceName,
        preAuthKey: config.preAuthKey,
      });

      // Get WireGuard configuration
      this.logger?.debug('VPN', 'Fetching WireGuard configuration');
      const wireGuardConfig = await this.headscaleClient.getWireGuardConfig(
        config.headscaleUrl,
        result.nodeId
      );

      // Save configuration
      this.logger?.debug('VPN', 'Saving configuration');
      await this.configManager.saveConfig(wireGuardConfig);

      this.logger?.info('VPN', 'Device registered successfully', {
        meshIP: result.meshIP,
        nodeId: result.nodeId,
      });

      return {
        meshIP: result.meshIP,
        nodeId: result.nodeId,
      };
    } catch (error) {
      const vpnError = toVPNError(error);
      this.logger?.error('VPN', 'Registration failed', {
        error: this.errorManager?.formatErrorForLogging(vpnError),
      });
      throw vpnError;
    }
  }

  async connect(): Promise<void> {
    this.logger?.info('VPN', 'Starting VPN connection');
    const startTime = Date.now();
    
    try {
      await this.connectionManager.connect();
      
      const duration = Date.now() - startTime;
      this.metrics?.recordConnectionAttempt(true, duration);
      this.logger?.info('VPN', 'VPN connected successfully', { duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      const vpnError = toVPNError(error);
      
      this.metrics?.recordConnectionAttempt(false, duration, vpnError.message);
      this.logger?.error('VPN', 'VPN connection failed', {
        error: this.errorManager?.formatErrorForLogging(vpnError),
        duration,
      });
      
      // Get recovery strategy
      if (this.errorManager) {
        const strategy = this.errorManager.getRecoveryStrategy(vpnError);
        this.logger?.info('VPN', 'Recovery strategy', { strategy });
        
        // Auto-retry if applicable
        if (strategy.autoRetry && strategy.retryDelay) {
          this.logger?.info('VPN', `Auto-retry in ${strategy.retryDelay}ms`);
          setTimeout(() => this.connect(), strategy.retryDelay);
        }
      }
      
      throw vpnError;
    }
  }

  async disconnect(): Promise<void> {
    this.logger?.info('VPN', 'Disconnecting VPN');
    
    try {
      // End session metrics
      this.metrics?.endSession();
      
      await this.connectionManager.disconnect();
      
      this.logger?.info('VPN', 'VPN disconnected successfully');
    } catch (error) {
      const vpnError = toVPNError(error);
      this.logger?.error('VPN', 'VPN disconnection failed', {
        error: this.errorManager?.formatErrorForLogging(vpnError),
      });
      throw vpnError;
    }
  }

  async getStatus(): Promise<VPNStatus> {
    return this.connectionManager.getStatus();
  }

  getConnectionInfo(): ConnectionInfo {
    return this.connectionManager.getConnectionInfo();
  }

  isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  async isConfigured(): Promise<boolean> {
    return this.configManager.hasConfig();
  }

  async getConfiguration(): Promise<WireGuardConfig | null> {
    return this.configManager.loadConfig();
  }

  async clearConfiguration(): Promise<void> {
    this.logger?.info('VPN', 'Clearing VPN configuration');
    
    // Disconnect if connected
    if (this.isConnected()) {
      await this.disconnect();
    }

    // Clear configuration
    await this.configManager.clearConfig();
    
    this.logger?.info('VPN', 'VPN configuration cleared');
  }

  enableAutoReconnect(config?: Partial<AutoReconnectConfig>): void {
    this.logger?.info('VPN', 'Enabling auto-reconnect', { config });
    this.autoReconnectManager.enable(config);
  }

  disableAutoReconnect(): void {
    this.logger?.info('VPN', 'Disabling auto-reconnect');
    this.autoReconnectManager.disable();
  }

  isAutoReconnectEnabled(): boolean {
    return this.autoReconnectManager.isEnabled();
  }

  addStatusChangeListener(listener: VPNStatusChangeListener): { remove: () => void } {
    return this.connectionManager.addStatusChangeListener(listener);
  }

  removeAllListeners(): void {
    this.connectionManager.removeAllListeners();
  }
}
