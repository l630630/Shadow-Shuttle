/**
 * Complete VPN Service Usage Example
 * 
 * Demonstrates the full VPN workflow from registration to connection
 */

import { DIContainer } from '../../core/DIContainer';
import { IVPNService } from './interfaces/IVPNService';

/**
 * Example 1: Complete registration and connection flow
 */
export async function completeVPNSetup() {
  const vpnService = DIContainer.resolve<IVPNService>('IVPNService');

  try {
    // Step 1: Register device with Headscale
    console.log('Registering device...');
    const result = await vpnService.register({
      headscaleUrl: 'https://headscale.example.com',
      deviceName: 'my-iphone',
      preAuthKey: 'your-pre-auth-key',
    });

    console.log('Registration successful!');
    console.log('- Node ID:', result.nodeId);
    console.log('- Mesh IP:', result.meshIP);

    // Step 2: Enable auto-reconnect
    console.log('\nEnabling auto-reconnect...');
    vpnService.enableAutoReconnect({
      reconnectOnNetworkChange: true,
      reconnectOnAppResume: true,
      maxRetries: 3,
    });

    // Step 3: Connect to VPN
    console.log('\nConnecting to VPN...');
    await vpnService.connect();

    console.log('Connected successfully!');

    // Step 4: Monitor status
    const subscription = vpnService.addStatusChangeListener((event) => {
      console.log('VPN Status changed:', event.status);
    });

    // Get connection info
    const info = vpnService.getConnectionInfo();
    console.log('\nConnection Info:');
    console.log('- Status:', info.status);
    console.log('- Mesh IP:', info.meshIP);
    console.log('- Connected at:', info.connectedAt);

    return { result, subscription };
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}

/**
 * Example 2: Connect with existing configuration
 */
export async function connectWithExistingConfig() {
  const vpnService = DIContainer.resolve<IVPNService>('IVPNService');

  try {
    // Check if configured
    const isConfigured = await vpnService.isConfigured();
    if (!isConfigured) {
      throw new Error('VPN not configured. Please register first.');
    }

    // Connect
    await vpnService.connect();
    console.log('Connected to VPN');

    return true;
  } catch (error) {
    console.error('Connection failed:', error);
    throw error;
  }
}

/**
 * Example 3: Disconnect from VPN
 */
export async function disconnectVPN() {
  const vpnService = DIContainer.resolve<IVPNService>('IVPNService');

  try {
    if (!vpnService.isConnected()) {
      console.log('VPN is not connected');
      return;
    }

    await vpnService.disconnect();
    console.log('Disconnected from VPN');
  } catch (error) {
    console.error('Disconnection failed:', error);
    throw error;
  }
}

/**
 * Example 4: Check VPN status
 */
export async function checkVPNStatus() {
  const vpnService = DIContainer.resolve<IVPNService>('IVPNService');

  const status = await vpnService.getStatus();
  const isConnected = vpnService.isConnected();
  const isConfigured = await vpnService.isConfigured();
  const info = vpnService.getConnectionInfo();

  console.log('VPN Status:');
  console.log('- Status:', status);
  console.log('- Connected:', isConnected);
  console.log('- Configured:', isConfigured);
  console.log('- Mesh IP:', info.meshIP);
  console.log('- Connected at:', info.connectedAt);
  console.log('- Disconnected at:', info.disconnectedAt);

  return { status, isConnected, isConfigured, info };
}

/**
 * Example 5: Manage auto-reconnect
 */
export function manageAutoReconnect(enabled: boolean) {
  const vpnService = DIContainer.resolve<IVPNService>('IVPNService');

  if (enabled) {
    vpnService.enableAutoReconnect({
      reconnectOnNetworkChange: true,
      reconnectOnAppResume: true,
      maxRetries: 5,
    });
    console.log('Auto-reconnect enabled');
  } else {
    vpnService.disableAutoReconnect();
    console.log('Auto-reconnect disabled');
  }

  const isEnabled = vpnService.isAutoReconnectEnabled();
  console.log('Auto-reconnect status:', isEnabled);

  return isEnabled;
}

/**
 * Example 6: Clear configuration and reset
 */
export async function resetVPN() {
  const vpnService = DIContainer.resolve<IVPNService>('IVPNService');

  try {
    // Disable auto-reconnect first
    vpnService.disableAutoReconnect();

    // Clear configuration (will disconnect if connected)
    await vpnService.clearConfiguration();

    console.log('VPN configuration cleared');

    // Verify
    const isConfigured = await vpnService.isConfigured();
    console.log('Is configured:', isConfigured); // Should be false

    return true;
  } catch (error) {
    console.error('Reset failed:', error);
    throw error;
  }
}

/**
 * Example 7: Monitor VPN status with React Hook
 */
export function useVPNStatus() {
  const vpnService = DIContainer.resolve<IVPNService>('IVPNService');
  
  // In a real React component, you would use useState and useEffect
  // This is just a demonstration of the pattern
  
  const subscription = vpnService.addStatusChangeListener((event) => {
    console.log('Status changed:', event.status);
    // Update state here in real component
  });

  // Cleanup function
  const cleanup = () => {
    subscription.remove();
  };

  return { cleanup };
}

/**
 * Example 8: Error handling patterns
 */
export async function robustVPNConnection() {
  const vpnService = DIContainer.resolve<IVPNService>('IVPNService');

  try {
    // Check if configured
    const isConfigured = await vpnService.isConfigured();
    if (!isConfigured) {
      throw new Error('请先配置 VPN');
    }

    // Check if already connected
    if (vpnService.isConnected()) {
      console.log('VPN 已连接');
      return;
    }

    // Try to connect
    await vpnService.connect();
    console.log('VPN 连接成功');

  } catch (error) {
    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('Permission')) {
        console.error('VPN 权限被拒绝，请在设置中允许 VPN 权限');
      } else if (error.message.includes('configuration')) {
        console.error('VPN 配置无效，请重新配置');
      } else if (error.message.includes('network')) {
        console.error('网络连接失败，请检查网络');
      } else {
        console.error('VPN 连接失败:', error.message);
      }
    }
    throw error;
  }
}

/**
 * Example 9: Complete lifecycle management
 */
export class VPNManager {
  private vpnService: IVPNService;
  private statusSubscription: { remove: () => void } | null = null;

  constructor() {
    this.vpnService = DIContainer.resolve<IVPNService>('IVPNService');
  }

  async initialize() {
    // Check if configured
    const isConfigured = await this.vpnService.isConfigured();
    
    if (isConfigured) {
      // Enable auto-reconnect
      this.vpnService.enableAutoReconnect();
      
      // Start monitoring status
      this.statusSubscription = this.vpnService.addStatusChangeListener((event) => {
        console.log('VPN Status:', event.status);
      });
    }

    return isConfigured;
  }

  async register(config: { headscaleUrl: string; deviceName: string; preAuthKey: string }) {
    const result = await this.vpnService.register(config);
    await this.initialize();
    return result;
  }

  async connect() {
    await this.vpnService.connect();
  }

  async disconnect() {
    await this.vpnService.disconnect();
  }

  getStatus() {
    return this.vpnService.getConnectionInfo();
  }

  cleanup() {
    this.statusSubscription?.remove();
    this.vpnService.disableAutoReconnect();
    this.vpnService.removeAllListeners();
  }
}
