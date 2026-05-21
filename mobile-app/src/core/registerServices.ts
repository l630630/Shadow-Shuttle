/**
 * Service Registration
 * 
 * Centralized service registration for the DI container.
 * This file should be imported and called at app startup.
 */

import { container } from './DIContainer';
import { FetchHttpClient } from '../services/vpn/http/FetchHttpClient';
import { MMKVStorage } from '../services/vpn/storage/MMKVStorage';
import { KeychainStorage } from '../services/vpn/storage/KeychainStorage';
import { ConfigParser } from '../services/vpn/config/ConfigParser';

/**
 * Register all application services with the DI container
 * Call this function once at app startup (e.g., in App.tsx or index.js)
 */
export function registerServices(): void {
  // Phase 1: Infrastructure and Tools
  container.register('IHttpClient', () => new FetchHttpClient(), 'singleton');
  container.register('ISecureStorage', () => new MMKVStorage('vpn-config'), 'singleton');
  container.register('IKeychainStorage', () => new KeychainStorage(), 'singleton');
  
  // Phase 2: Configuration Management
  container.register('IConfigParser', () => new ConfigParser(), 'transient');
  // container.register('IConfigValidator', () => new ConfigValidator(), 'transient');
  // container.register('IConfigManager', (c) => {
  //   const storage = c.resolve<ISecureStorage>('ISecureStorage');
  //   const validator = c.resolve<IConfigValidator>('IConfigValidator');
  //   return new ConfigManager(storage, validator);
  // }, 'singleton');
  
  // Phase 3: Headscale Integration
  // container.register('IHeadscaleClient', (c) => {
  //   const httpClient = c.resolve<IHttpClient>('IHttpClient');
  //   return new HeadscaleClient(httpClient);
  // }, 'singleton');
  
  // Phase 5: Business Logic
  // container.register('IWireGuardBridge', () => new WireGuardBridge(), 'singleton');
  // container.register('IConnectionManager', (c) => {
  //   const bridge = c.resolve<IWireGuardBridge>('IWireGuardBridge');
  //   const configManager = c.resolve<IConfigManager>('IConfigManager');
  //   return new ConnectionManager(bridge, configManager);
  // }, 'singleton');
  
  // container.register('IRetryStrategy', () => new ExponentialBackoffRetry(), 'transient');
  // container.register('INetworkMonitor', () => new NetworkMonitor(), 'singleton');
  // container.register('IAutoReconnectManager', (c) => {
  //   const connectionManager = c.resolve<IConnectionManager>('IConnectionManager');
  //   const networkMonitor = c.resolve<INetworkMonitor>('INetworkMonitor');
  //   const retryStrategy = c.resolve<IRetryStrategy>('IRetryStrategy');
  //   return new AutoReconnectManager(connectionManager, networkMonitor, retryStrategy);
  // }, 'singleton');
  
  // container.register('IVPNService', (c) => {
  //   const connectionManager = c.resolve<IConnectionManager>('IConnectionManager');
  //   const configManager = c.resolve<IConfigManager>('IConfigManager');
  //   const headscaleClient = c.resolve<IHeadscaleClient>('IHeadscaleClient');
  //   const autoReconnect = c.resolve<IAutoReconnectManager>('IAutoReconnectManager');
  //   return new VPNService(connectionManager, configManager, headscaleClient, autoReconnect);
  // }, 'singleton');
  
  // Phase 7: Error Handling and Logging
  // container.register('VPNLogger', () => new VPNLogger(), 'singleton');
  // container.register('VPNMetrics', () => new VPNMetrics(), 'singleton');
  // container.register('ErrorRecoveryManager', () => new ErrorRecoveryManager(), 'singleton');
  
  console.log('[DI] Services registered:', container.getRegisteredKeys().length);
}

/**
 * Clear all registered services
 * Useful for testing or app reset
 */
export function clearServices(): void {
  container.clear();
  console.log('[DI] All services cleared');
}
