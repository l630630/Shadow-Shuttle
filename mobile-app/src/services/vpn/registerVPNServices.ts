/**
 * VPN Services Registration
 * 
 * Register all VPN services to DI container
 */

import { container } from '../../core/DIContainer';

// HTTP
import { IHttpClient } from './interfaces/IHttpClient';
import { FetchHttpClient } from './http/FetchHttpClient';

// Storage
import { ISecureStorage } from './interfaces/ISecureStorage';
import { MMKVStorage } from './storage/MMKVStorage';
import { KeychainStorage } from './storage/KeychainStorage';

// Config
import { IConfigParser } from './interfaces/IConfigParser';
import { ConfigParser } from './config/ConfigParser';
import { IConfigValidator } from './interfaces/IConfigValidator';
import { ConfigValidator } from './config/ConfigValidator';
import { IConfigManager } from './interfaces/IConfigManager';
import { ConfigManager } from './config/ConfigManager';

// Headscale
import { IHeadscaleClient } from './interfaces/IHeadscaleClient';
import { HeadscaleClient } from './headscale/HeadscaleClient';

// Bridge
import { IWireGuardBridge } from './interfaces/IWireGuardBridge';
import { WireGuardBridge } from './bridge/WireGuardBridge';

// Connection
import { IConnectionManager } from './interfaces/IConnectionManager';
import { ConnectionManager } from './connection/ConnectionManager';

// Retry
import { IRetryStrategy } from './interfaces/IRetryStrategy';
import { ExponentialBackoffRetry } from './retry/ExponentialBackoffRetry';

// Network
import { INetworkMonitor } from './interfaces/INetworkMonitor';
import { NetworkMonitor } from './network/NetworkMonitor';

// Auto-Reconnect
import { IAutoReconnectManager } from './interfaces/IAutoReconnectManager';
import { AutoReconnectManager } from './reconnect/AutoReconnectManager';

// VPN Service
import { IVPNService } from './interfaces/IVPNService';
import { VPNService } from './VPNService';

// Error Handling
import { ErrorRecoveryManager } from './errors/ErrorRecoveryManager';

// Logging
import { VPNLogger, getVPNLogger, setVPNLogger } from './logging/VPNLogger';

// Metrics
import { VPNMetrics, getVPNMetrics, setVPNMetrics } from './metrics/VPNMetrics';

/**
 * Register all VPN services to DI container
 */
export function registerVPNServices(): void {
  console.log('🔧 Registering VPN services...');

  // Error Recovery Manager
  container.register<ErrorRecoveryManager>('ErrorRecoveryManager', () => {
    return new ErrorRecoveryManager();
  });

  // VPN Logger (Singleton)
  const logger = new VPNLogger({
    minLevel: __DEV__ ? 0 : 1, // DEBUG in dev, INFO in prod
    enableConsole: true,
    enableStorage: true,
    filterSensitiveData: true,
  });
  setVPNLogger(logger);
  container.register<VPNLogger>('VPNLogger', () => logger);

  // VPN Metrics (Singleton)
  const metrics = new VPNMetrics();
  setVPNMetrics(metrics);
  container.register<VPNMetrics>('VPNMetrics', () => metrics);
  
  // HTTP Client
  container.register<IHttpClient>('IHttpClient', () => {
    return new FetchHttpClient();
  });

  // Secure Storage
  container.register<ISecureStorage>('ISecureStorage', () => {
    return new MMKVStorage();
  });

  container.register<ISecureStorage>('IKeychainStorage', () => {
    return new KeychainStorage();
  });

  // Config Parser
  container.register<IConfigParser>('IConfigParser', () => {
    return new ConfigParser();
  });

  // Config Validator
  container.register<IConfigValidator>('IConfigValidator', () => {
    return new ConfigValidator();
  });

  // Config Manager
  container.register<IConfigManager>('IConfigManager', () => {
    const storage = container.resolve<ISecureStorage>('ISecureStorage');
    const validator = container.resolve<IConfigValidator>('IConfigValidator');
    return new ConfigManager(storage, validator);
  });

  // Headscale Client
  container.register<IHeadscaleClient>('IHeadscaleClient', () => {
    const httpClient = container.resolve<IHttpClient>('IHttpClient');
    const configParser = container.resolve<IConfigParser>('IConfigParser');
    return new HeadscaleClient(httpClient, configParser);
  });

  // WireGuard Bridge
  container.register<IWireGuardBridge>('IWireGuardBridge', () => {
    try {
      return new WireGuardBridge();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        '⚠️ WireGuard native module not available. Falling back to stub bridge. ' +
          'VPN connect/disconnect will fail until native module is linked.',
        message
      );

      const stub: IWireGuardBridge = {
        async connect() {
          throw new Error(
            `WireGuardModule not available. Please ensure iOS native module and Network Extension are set up. (${message})`
          );
        },
        async disconnect() {
          throw new Error(
            `WireGuardModule not available. Please ensure iOS native module and Network Extension are set up. (${message})`
          );
        },
        async getStatus() {
          return 'invalid';
        },
        addStatusChangeListener() {
          return { remove: () => {} };
        },
        removeAllListeners() {},
      };

      return stub;
    }
  });

  // Connection Manager
  container.register<IConnectionManager>('IConnectionManager', () => {
    const bridge = container.resolve<IWireGuardBridge>('IWireGuardBridge');
    const configManager = container.resolve<IConfigManager>('IConfigManager');
    const configParser = container.resolve<IConfigParser>('IConfigParser');
    return new ConnectionManager(bridge, configManager, configParser);
  });

  // Retry Strategy
  container.register<IRetryStrategy>('IRetryStrategy', () => {
    return new ExponentialBackoffRetry({
      maxRetries: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitterFactor: 0.3,
    });
  });

  // Network Monitor
  container.register<INetworkMonitor>('INetworkMonitor', () => {
    return new NetworkMonitor();
  });

  // Auto-Reconnect Manager
  container.register<IAutoReconnectManager>('IAutoReconnectManager', () => {
    const connectionManager = container.resolve<IConnectionManager>('IConnectionManager');
    const networkMonitor = container.resolve<INetworkMonitor>('INetworkMonitor');
    const retryStrategy = container.resolve<IRetryStrategy>('IRetryStrategy');
    return new AutoReconnectManager(connectionManager, networkMonitor, retryStrategy);
  });

  // VPN Service (Facade)
  container.register<IVPNService>('IVPNService', () => {
    const headscaleClient = container.resolve<IHeadscaleClient>('IHeadscaleClient');
    const configManager = container.resolve<IConfigManager>('IConfigManager');
    const connectionManager = container.resolve<IConnectionManager>('IConnectionManager');
    const autoReconnectManager = container.resolve<IAutoReconnectManager>('IAutoReconnectManager');
    const errorManager = container.resolve<ErrorRecoveryManager>('ErrorRecoveryManager');
    const logger = container.resolve<VPNLogger>('VPNLogger');
    const metrics = container.resolve<VPNMetrics>('VPNMetrics');
    
    return new VPNService(
      headscaleClient,
      configManager,
      connectionManager,
      autoReconnectManager,
      errorManager,
      logger,
      metrics
    );
  });

  console.log('✅ VPN services registered successfully');
  logger.info('VPN', 'All VPN services registered to DI container');
}

/**
 * Verify all services are registered correctly
 */
export function verifyVPNServices(): boolean {
  const logger = getVPNLogger();
  
  try {
    logger.info('VPN', 'Verifying VPN services registration...');
    
    // IMPORTANT:
    // Do NOT eagerly resolve services here. Some services depend on native modules
    // (e.g. MMKV / NetInfo / native bridge) and will throw if the native side
    // is not ready or not linked. We only verify that registrations exist.
    const services = [
      'IHttpClient',
      'ISecureStorage',
      'IKeychainStorage',
      'IConfigParser',
      'IConfigValidator',
      'IConfigManager',
      'IHeadscaleClient',
      'IWireGuardBridge',
      'IConnectionManager',
      'IRetryStrategy',
      'INetworkMonitor',
      'IAutoReconnectManager',
      'ErrorRecoveryManager',
      'VPNLogger',
      'VPNMetrics',
      'IVPNService',
    ];
    
    const missing: string[] = [];
    for (const serviceName of services) {
      try {
        if (!container.has(serviceName)) {
          missing.push(serviceName);
          logger.error('VPN', `✗ Missing registration for ${serviceName}`);
          continue;
        }
        logger.debug('VPN', `✓ ${serviceName} registered`);
      } catch (error) {
        missing.push(serviceName);
        logger.error('VPN', `✗ Failed to verify registration for ${serviceName}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (missing.length > 0) {
      const registeredKeys = container.getRegisteredKeys();
      logger.error('VPN', 'VPN services verification failed (missing registrations)', {
        missing,
        registeredCount: registeredKeys.length,
        registeredKeys,
      });
      console.warn('⚠️ VPN services verification failed. Missing:', missing);
      console.warn('ℹ️ Registered DI keys:', registeredKeys);
      return false;
    }
    
    logger.info('VPN', '✅ All VPN services verified successfully');
    return true;
  } catch (error) {
    logger.error('VPN', 'Failed to verify VPN services', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Get registered service count
 */
export function getRegisteredServiceCount(): number {
  return 16; // Total number of registered services
}
