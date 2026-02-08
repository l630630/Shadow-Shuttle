/**
 * Device Discovery Service
 * 通过 Headscale API 发现网络中的设备
 */

import { Device } from '../types/device';

export interface HeadscaleNode {
  id: string;
  name: string;
  givenName: string;
  user: {
    id: string;
    name: string;
  };
  ipAddresses: string[];
  online: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface DeviceDiscoveryConfig {
  headscaleUrl: string;
  apiKey: string;
  userId?: string;
}

export class DeviceDiscoveryService {
  private config: DeviceDiscoveryConfig;

  constructor(config: DeviceDiscoveryConfig) {
    this.config = config;
  }

  /**
   * 从 Headscale API 发现设备
   */
  async discoverDevices(): Promise<Device[]> {
    try {
      const nodes = await this.fetchNodesFromHeadscale();
      return this.convertNodesToDevices(nodes);
    } catch (error) {
      console.error('Failed to discover devices:', error);
      throw new Error('设备发现失败');
    }
  }

  /**
   * 从 Headscale API 获取节点列表
   */
  private async fetchNodesFromHeadscale(): Promise<HeadscaleNode[]> {
    const url = `${this.config.headscaleUrl}/api/v1/machine`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Headscale API error: ${response.status}`);
    }

    const data = await response.json();
    return data.machines || [];
  }

  /**
   * 根据设备名称/hostname 推断操作系统，用于生成正确的 shell 命令（如 macOS 用 open -a 打开应用）
   */
  private inferOS(name: string, hostname: string): 'macos' | 'linux' | 'windows' {
    const s = `${name} ${hostname}`.toLowerCase();
    if (/mac|darwin|imac|macbook|apple/.test(s)) return 'macos';
    if (/win|windows|pc\./.test(s)) return 'windows';
    return 'linux';
  }

  /**
   * 将 Headscale 节点转换为设备对象
   */
  private convertNodesToDevices(nodes: HeadscaleNode[]): Device[] {
    return nodes
      .filter(node => {
        // 过滤掉当前设备（手机）
        // 只保留电脑设备
        return !node.name.includes('mobile') && !node.name.includes('phone');
      })
      .map(node => {
        const name = node.givenName || node.name;
        return {
          id: node.id,
          name,
          hostname: node.name,
          meshIP: node.ipAddresses[0] || '',
          sshPort: 22,
          grpcPort: 50052,
          publicKey: '', // 需要从其他地方获取
          online: node.online,
          lastSeen: new Date(node.lastSeen),
          os: this.inferOS(name, node.name),
        };
      });
  }

  /**
   * 检查单个设备的在线状态
   */
  async checkDeviceStatus(deviceId: string): Promise<boolean> {
    try {
      const url = `${this.config.headscaleUrl}/api/v1/machine/${deviceId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.machine?.online || false;
    } catch (error) {
      console.error(`Failed to check device ${deviceId} status:`, error);
      return false;
    }
  }

  /**
   * 批量检查设备状态
   */
  async checkMultipleDeviceStatuses(deviceIds: string[]): Promise<Map<string, boolean>> {
    const statusMap = new Map<string, boolean>();
    
    await Promise.all(
      deviceIds.map(async (deviceId) => {
        const online = await this.checkDeviceStatus(deviceId);
        statusMap.set(deviceId, online);
      })
    );

    return statusMap;
  }
}

/**
 * 创建设备发现服务实例
 */
export function createDeviceDiscoveryService(
  config: DeviceDiscoveryConfig
): DeviceDiscoveryService {
  return new DeviceDiscoveryService(config);
}

/**
 * 演示模式的设备发现服务
 * 返回模拟数据用于测试
 */
export class MockDeviceDiscoveryService extends DeviceDiscoveryService {
  async discoverDevices(): Promise<Device[]> {
    // 返回模拟设备数据
    // 注意：Android 模拟器访问本机需要使用 10.0.2.2
    return [
      {
        id: 'device-1',
        name: 'MacBook Air',
        hostname: '630MacBook-Air.local',
        meshIP: 'localhost', // 通过 WebSocket 代理连接
        sshPort: 22, // SSH 端口（代理会转发）
        grpcPort: 50052,
        publicKey: 'mock_public_key_1',
        online: true,
        lastSeen: new Date(),
        os: 'macos',
      },
      {
        id: 'device-2',
        name: 'Ubuntu Server',
        hostname: 'ubuntu-server',
        meshIP: '100.64.0.3',
        sshPort: 22,
        grpcPort: 50052,
        publicKey: 'mock_public_key_2',
        online: true,
        lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
        os: 'linux',
      },
      {
        id: 'device-3',
        name: 'Windows Desktop',
        hostname: 'windows-pc',
        meshIP: '100.64.0.4',
        sshPort: 22,
        grpcPort: 50052,
        publicKey: 'mock_public_key_3',
        online: false,
        lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
        os: 'windows',
      },
    ];
  }

  async checkDeviceStatus(deviceId: string): Promise<boolean> {
    // 模拟在线状态检查
    return Math.random() > 0.3; // 70% 在线率
  }
}

/**
 * 获取设备发现服务（根据环境返回真实或模拟服务）
 */
export function getDeviceDiscoveryService(
  config?: DeviceDiscoveryConfig
): DeviceDiscoveryService {
  // 如果没有配置，返回模拟服务
  if (!config || !config.headscaleUrl || !config.apiKey) {
    return new MockDeviceDiscoveryService({
      headscaleUrl: 'http://localhost:8080',
      apiKey: 'mock_api_key',
    });
  }

  return new DeviceDiscoveryService(config);
}
