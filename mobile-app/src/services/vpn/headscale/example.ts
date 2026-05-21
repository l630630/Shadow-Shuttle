/**
 * Headscale Client Usage Example
 * 
 * Demonstrates how to use HeadscaleClient with DI container
 */

import { DIContainer } from '../../../core/DIContainer';
import { IHeadscaleClient } from '../interfaces/IHeadscaleClient';
import { IConfigManager } from '../interfaces/IConfigManager';

/**
 * Example: Register device and save configuration
 */
export async function registerAndSaveConfig() {
  // Get services from DI container
  const headscaleClient = DIContainer.resolve<IHeadscaleClient>('IHeadscaleClient');
  const configManager = DIContainer.resolve<IConfigManager>('IConfigManager');

  try {
    // Step 1: Register device with Headscale
    console.log('Registering device...');
    const result = await headscaleClient.registerDevice({
      baseUrl: 'https://headscale.example.com',
      deviceName: 'my-phone',
      preAuthKey: 'your-pre-auth-key',
    });

    console.log('Registration successful:');
    console.log('- Node ID:', result.nodeId);
    console.log('- Node Name:', result.nodeName);
    console.log('- Mesh IP:', result.meshIP);

    // Step 2: Get WireGuard configuration
    console.log('\nGetting WireGuard config...');
    const config = await headscaleClient.getWireGuardConfig(
      'https://headscale.example.com',
      result.nodeId
    );

    console.log('Config retrieved:');
    console.log('- Interface Address:', config.interface.address);
    console.log('- DNS:', config.interface.dns);
    console.log('- Peers:', config.peers.length);

    // Step 3: Save configuration
    console.log('\nSaving configuration...');
    await configManager.saveConfig(config);

    console.log('Configuration saved successfully!');
    console.log('You can now connect to VPN using this configuration.');

    return {
      nodeId: result.nodeId,
      meshIP: result.meshIP,
      config,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
      
      // Handle specific errors
      if (error.message.includes('Authentication failed')) {
        console.error('Please check your pre-auth key');
      } else if (error.message.includes('not found')) {
        console.error('Please check your Headscale URL');
      } else if (error.message.includes('timeout')) {
        console.error('Please check your network connection');
      }
    }
    throw error;
  }
}

/**
 * Example: Load saved configuration
 */
export async function loadSavedConfig() {
  const configManager = DIContainer.resolve<IConfigManager>('IConfigManager');

  try {
    const config = await configManager.loadConfig();

    if (!config) {
      console.log('No saved configuration found');
      return null;
    }

    console.log('Loaded configuration:');
    console.log('- Interface Address:', config.interface.address);
    console.log('- DNS:', config.interface.dns);
    console.log('- Peers:', config.peers.length);

    return config;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw error;
  }
}

/**
 * Example: Clear saved configuration
 */
export async function clearSavedConfig() {
  const configManager = DIContainer.resolve<IConfigManager>('IConfigManager');

  try {
    await configManager.clearConfig();
    console.log('Configuration cleared successfully');
  } catch (error) {
    console.error('Failed to clear configuration:', error);
    throw error;
  }
}

/**
 * Example: Complete flow with error handling
 */
export async function completeRegistrationFlow(
  headscaleUrl: string,
  deviceName: string,
  preAuthKey: string
) {
  const headscaleClient = DIContainer.resolve<IHeadscaleClient>('IHeadscaleClient');
  const configManager = DIContainer.resolve<IConfigManager>('IConfigManager');

  // Check if already configured
  const hasConfig = await configManager.hasConfig();
  if (hasConfig) {
    console.log('Device already configured');
    const config = await configManager.loadConfig();
    return { alreadyConfigured: true, config };
  }

  // Register new device
  try {
    const result = await headscaleClient.registerDevice({
      baseUrl: headscaleUrl,
      deviceName,
      preAuthKey,
    });

    const config = await headscaleClient.getWireGuardConfig(
      headscaleUrl,
      result.nodeId
    );

    await configManager.saveConfig(config);

    return {
      alreadyConfigured: false,
      nodeId: result.nodeId,
      meshIP: result.meshIP,
      config,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Provide user-friendly error messages
      if (error.message.includes('Authentication failed')) {
        throw new Error('无效的预授权密钥，请检查后重试');
      } else if (error.message.includes('not found')) {
        throw new Error('无法连接到 Headscale 服务器，请检查 URL');
      } else if (error.message.includes('timeout')) {
        throw new Error('连接超时，请检查网络连接');
      } else if (error.message.includes('Invalid configuration')) {
        throw new Error('服务器返回的配置无效，请联系管理员');
      }
    }
    throw error;
  }
}
