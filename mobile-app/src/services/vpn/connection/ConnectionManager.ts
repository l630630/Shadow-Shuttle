/**
 * Connection Manager Implementation
 * 
 * Manages VPN connection lifecycle with state tracking
 */

import { IConnectionManager, ConnectionInfo } from '../interfaces/IConnectionManager';
import { IWireGuardBridge, VPNStatus, VPNStatusChangeListener } from '../interfaces/IWireGuardBridge';
import { IConfigManager } from '../interfaces/IConfigManager';
import { IConfigParser } from '../interfaces/IConfigParser';

export class ConnectionManager implements IConnectionManager {
  private currentStatus: VPNStatus = 'disconnected';
  private connectedAt?: Date;
  private disconnectedAt?: Date;
  private meshIP?: string;

  constructor(
    private bridge: IWireGuardBridge,
    private configManager: IConfigManager,
    private configParser: IConfigParser
  ) {
    // Initialize status from bridge
    this.initializeStatus();

    // Listen to status changes
    this.bridge.addStatusChangeListener((event) => {
      this.handleStatusChange(event.status);
    });
  }

  async connect(): Promise<void> {
    // Check if already connected
    if (this.currentStatus === 'connected' || this.currentStatus === 'connecting') {
      throw new Error('Already connected or connecting');
    }

    // Load configuration
    const config = await this.configManager.loadConfig();
    if (!config) {
      throw new Error('No VPN configuration found. Please configure VPN first.');
    }

    // Format configuration to INI string
    const configString = this.configParser.format(config);

    // Extract mesh IP from configuration
    this.meshIP = config.interface.address.split('/')[0];

    // Connect via bridge
    await this.bridge.connect(configString);

    // Update state
    this.connectedAt = new Date();
    this.disconnectedAt = undefined;
  }

  async disconnect(): Promise<void> {
    // Check if already disconnected
    if (this.currentStatus === 'disconnected' || this.currentStatus === 'disconnecting') {
      throw new Error('Already disconnected or disconnecting');
    }

    // Disconnect via bridge
    await this.bridge.disconnect();

    // Update state
    this.disconnectedAt = new Date();
  }

  async getStatus(): Promise<VPNStatus> {
    const status = await this.bridge.getStatus();
    this.currentStatus = status;
    return status;
  }

  getConnectionInfo(): ConnectionInfo {
    return {
      status: this.currentStatus,
      connectedAt: this.connectedAt,
      disconnectedAt: this.disconnectedAt,
      meshIP: this.meshIP,
    };
  }

  isConnected(): boolean {
    return this.currentStatus === 'connected';
  }

  addStatusChangeListener(listener: VPNStatusChangeListener): { remove: () => void } {
    return this.bridge.addStatusChangeListener(listener);
  }

  removeAllListeners(): void {
    this.bridge.removeAllListeners();
  }

  // MARK: - Private Methods

  private async initializeStatus(): Promise<void> {
    try {
      this.currentStatus = await this.bridge.getStatus();
    } catch (error) {
      console.error('Failed to initialize status:', error);
      this.currentStatus = 'invalid';
    }
  }

  private handleStatusChange(status: VPNStatus): void {
    const previousStatus = this.currentStatus;
    this.currentStatus = status;

    // Update timestamps based on status transitions
    if (status === 'connected' && previousStatus !== 'connected') {
      this.connectedAt = new Date();
      this.disconnectedAt = undefined;
    } else if (status === 'disconnected' && previousStatus !== 'disconnected') {
      this.disconnectedAt = new Date();
    }
  }
}
