/**
 * API Configuration
 * 配置 Headscale API 和其他服务端点
 */

export interface APIConfig {
  headscale: {
    url: string;
    apiKey: string;
  };
  shadowd: {
    defaultSSHPort: number;
    defaultGRPCPort: number;
  };
}

/**
 * 默认配置
 * 使用本地 Headscale 服务器
 * 注意：Android 模拟器访问电脑 localhost 需要使用 10.0.2.2
 */
export const defaultConfig: APIConfig = {
  headscale: {
    // Android 模拟器访问电脑 localhost
    url: 'http://10.0.2.2:8080',
    apiKey: process.env.HEADSCALE_API_KEY || '',
  },
  shadowd: {
    defaultSSHPort: 22,
    defaultGRPCPort: 50052,
  },
};

/**
 * 生产配置
 * 连接到真实的 Headscale 服务器
 */
export const productionConfig: APIConfig = {
  headscale: {
    url: process.env.HEADSCALE_URL || 'https://headscale.example.com',
    apiKey: process.env.HEADSCALE_API_KEY || '',
  },
  shadowd: {
    defaultSSHPort: 22,
    defaultGRPCPort: 50052,
  },
};

/**
 * 获取当前配置
 * 根据环境变量决定使用哪个配置
 */
export function getAPIConfig(): APIConfig {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return productionConfig;
  }
  
  return defaultConfig;
}

/**
 * 验证配置是否有效
 */
export function validateConfig(config: APIConfig): boolean {
  if (!config.headscale.url) {
    console.error('Headscale URL is required');
    return false;
  }
  
  if (!config.headscale.apiKey) {
    console.error('Headscale API key is required');
    return false;
  }
  
  return true;
}

/**
 * 更新配置
 * 允许运行时更新配置
 */
let currentConfig: APIConfig = defaultConfig;

export function updateConfig(newConfig: Partial<APIConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...newConfig,
    headscale: {
      ...currentConfig.headscale,
      ...(newConfig.headscale || {}),
    },
    shadowd: {
      ...currentConfig.shadowd,
      ...(newConfig.shadowd || {}),
    },
  };
}

export function getCurrentConfig(): APIConfig {
  return currentConfig;
}
