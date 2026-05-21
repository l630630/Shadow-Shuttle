/**
 * Storage Usage Examples
 * 
 * Demonstrates how to use MMKVStorage and KeychainStorage for VPN configuration.
 */

import { container } from '../../../core';
import { ISecureStorage, KeychainStorage } from './index';

/**
 * Example 1: Store and retrieve VPN configuration
 */
export async function exampleStoreVPNConfig() {
  const storage = container.resolve<ISecureStorage>('ISecureStorage');
  
  const vpnConfig = {
    headscaleUrl: 'https://headscale.example.com',
    deviceName: 'my-phone',
    interface: {
      address: '10.0.0.2/24',
      dns: '1.1.1.1',
    },
    peer: {
      publicKey: 'peer-public-key-here',
      endpoint: 'vpn.example.com:51820',
      allowedIPs: '0.0.0.0/0',
      persistentKeepalive: 25,
    },
  };
  
  await storage.set('vpn-config', vpnConfig);
  console.log('VPN config saved');
  
  // Retrieve it
  const retrieved = await storage.get('vpn-config');
  console.log('Retrieved config:', retrieved);
}

/**
 * Example 2: Store private key securely
 */
export async function exampleStorePrivateKey() {
  const keychain = container.resolve<KeychainStorage>('IKeychainStorage');
  
  const privateKey = 'wG1234567890abcdefghijklmnopqrstuvwxyz=';
  
  await keychain.storePrivateKey('wireguard', privateKey);
  console.log('Private key stored securely');
  
  // Retrieve it
  const retrieved = await keychain.getPrivateKey('wireguard');
  console.log('Private key retrieved:', retrieved ? '***' : 'null');
}

/**
 * Example 3: Complete VPN setup workflow
 */
export async function exampleCompleteVPNSetup(
  headscaleUrl: string,
  preAuthKey: string,
  deviceName: string
) {
  const storage = container.resolve<ISecureStorage>('ISecureStorage');
  const keychain = container.resolve<KeychainStorage>('IKeychainStorage');
  
  // Step 1: Store Headscale credentials
  await storage.set('headscale-url', headscaleUrl);
  await keychain.set('pre-auth-key', preAuthKey);
  await storage.set('device-name', deviceName);
  
  console.log('Headscale credentials stored');
  
  // Step 2: After registration, store WireGuard config
  const wireGuardConfig = {
    interface: {
      address: '10.0.0.2/24',
      dns: '1.1.1.1',
    },
    peer: {
      publicKey: 'received-from-headscale',
      endpoint: 'vpn.example.com:51820',
      allowedIPs: '0.0.0.0/0',
    },
  };
  
  const privateKey = 'generated-or-received-private-key';
  
  await storage.set('vpn-config', wireGuardConfig);
  await keychain.storePrivateKey('vpn', privateKey);
  
  console.log('VPN configuration stored securely');
}

/**
 * Example 4: Load complete VPN configuration
 */
export async function exampleLoadVPNConfig() {
  const storage = container.resolve<ISecureStorage>('ISecureStorage');
  const keychain = container.resolve<KeychainStorage>('IKeychainStorage');
  
  // Load config
  const config = await storage.get('vpn-config');
  if (!config) {
    throw new Error('VPN configuration not found');
  }
  
  // Load private key
  const privateKey = await keychain.getPrivateKey('vpn');
  if (!privateKey) {
    throw new Error('Private key not found');
  }
  
  // Combine them
  const completeConfig = {
    ...config,
    interface: {
      ...config.interface,
      privateKey,
    },
  };
  
  return completeConfig;
}

/**
 * Example 5: Check if VPN is configured
 */
export async function exampleIsVPNConfigured(): Promise<boolean> {
  const storage = container.resolve<ISecureStorage>('ISecureStorage');
  const keychain = container.resolve<KeychainStorage>('IKeychainStorage');
  
  const hasConfig = await storage.has('vpn-config');
  const hasPrivateKey = await keychain.getPrivateKey('vpn') !== null;
  
  return hasConfig && hasPrivateKey;
}

/**
 * Example 6: Clear VPN configuration
 */
export async function exampleClearVPNConfig() {
  const storage = container.resolve<ISecureStorage>('ISecureStorage');
  const keychain = container.resolve<KeychainStorage>('IKeychainStorage');
  
  // Remove VPN config
  await storage.remove('vpn-config');
  await storage.remove('headscale-url');
  await storage.remove('device-name');
  
  // Remove sensitive data
  await keychain.removePrivateKey('vpn');
  await keychain.remove('pre-auth-key');
  
  console.log('VPN configuration cleared');
}

/**
 * Example 7: Update VPN configuration
 */
export async function exampleUpdateVPNConfig(updates: any) {
  const storage = container.resolve<ISecureStorage>('ISecureStorage');
  
  // Load existing config
  const existingConfig = await storage.get('vpn-config');
  if (!existingConfig) {
    throw new Error('No existing configuration to update');
  }
  
  // Merge updates
  const updatedConfig = {
    ...existingConfig,
    ...updates,
  };
  
  // Save updated config
  await storage.set('vpn-config', updatedConfig);
  console.log('VPN configuration updated');
}

/**
 * Example 8: Store multiple device configurations
 */
export async function exampleMultipleDeviceConfigs() {
  const storage = container.resolve<ISecureStorage>('ISecureStorage');
  const keychain = container.resolve<KeychainStorage>('IKeychainStorage');
  
  const devices = [
    { id: 'device1', name: 'Home Server', config: { /* ... */ } },
    { id: 'device2', name: 'Work Laptop', config: { /* ... */ } },
  ];
  
  for (const device of devices) {
    await storage.set(`vpn-config-${device.id}`, device.config);
    await keychain.storePrivateKey(`vpn-${device.id}`, 'private-key');
  }
  
  console.log('Multiple device configurations stored');
}

/**
 * Example 9: Export configuration for backup
 */
export async function exampleExportConfig() {
  const storage = container.resolve<ISecureStorage>('ISecureStorage');
  
  // Get all VPN-related keys
  const allKeys = await storage.getAllKeys();
  const vpnKeys = allKeys.filter(key => key.startsWith('vpn-') || key.startsWith('headscale-'));
  
  const exportData: Record<string, any> = {};
  for (const key of vpnKeys) {
    exportData[key] = await storage.get(key);
  }
  
  // Note: Private keys should NOT be exported
  console.log('Configuration exported (without private keys)');
  return exportData;
}

/**
 * Example 10: Import configuration from backup
 */
export async function exampleImportConfig(importData: Record<string, any>) {
  const storage = container.resolve<ISecureStorage>('ISecureStorage');
  
  for (const [key, value] of Object.entries(importData)) {
    await storage.set(key, value);
  }
  
  console.log('Configuration imported');
  // Note: User will need to re-enter private keys
}
