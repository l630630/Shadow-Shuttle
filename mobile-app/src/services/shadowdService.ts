/**
 * Shadowd HTTP API Service
 * Communicates with shadowd HTTP API server
 */

export interface ShadowdDeviceInfo {
  id: string;
  name: string;
  os: string;
  osVersion: string;
  meshIP: string;
  publicKey: string;
  isOnline: boolean;
  lastSeen: number;
  sshPort: number;
  grpcPort: number;
}

export interface ShadowdPairingCode {
  deviceId: string;
  deviceName: string;
  meshIp: string;
  publicKey: string;
  timestamp: number;
  qrCode: string;
}

export interface ShadowdHealthStatus {
  status: string;
  uptime: number;
  connected: boolean;
  lastCheck: number;
}

export class ShadowdService {
  private baseUrl: string;
  
  constructor(host: string = '10.0.2.2', port: number = 8080) {
    // Default to Android emulator address
    // For iOS simulator, use 'localhost'
    // For real device, use your Mac's IP address
    this.baseUrl = `http://${host}:${port}/api`;
  }
  
  /**
   * Set the base URL for the shadowd API
   */
  setBaseUrl(host: string, port: number = 8080) {
    this.baseUrl = `http://${host}:${port}/api`;
  }
  
  /**
   * Get device information from shadowd
   */
  async getDeviceInfo(): Promise<ShadowdDeviceInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/device/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      // 静默处理 HTTP API 错误，因为 SSH 功能不依赖它
      console.log('[shadowdService] HTTP API unavailable:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
  
  /**
   * Generate pairing code for QR code scanning
   */
  async generatePairingCode(): Promise<ShadowdPairingCode> {
    try {
      const response = await fetch(`${this.baseUrl}/device/pairing-code`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('[shadowdService] Failed to generate pairing code:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
  
  /**
   * Check health status of shadowd
   */
  async healthCheck(): Promise<ShadowdHealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('[shadowdService] Health check failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
  
  /**
   * Discover devices on the network
   * This will scan for shadowd instances on the local network
   */
  async discoverDevices(hosts: string[]): Promise<ShadowdDeviceInfo[]> {
    const devices: ShadowdDeviceInfo[] = [];
    
    // Try to connect to each host
    const promises = hosts.map(async (host) => {
      try {
        const service = new ShadowdService(host, 8080);
        const deviceInfo = await service.getDeviceInfo();
        return deviceInfo;
      } catch (error) {
        // Host not reachable or not running shadowd
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    
    // Filter out null results
    results.forEach(result => {
      if (result) {
        devices.push(result);
      }
    });
    
    return devices;
  }
  
  /**
   * Scan local network for shadowd instances
   * Scans common private IP ranges
   */
  async scanLocalNetwork(): Promise<ShadowdDeviceInfo[]> {
    const devices: ShadowdDeviceInfo[] = [];
    
    // Get device's own IP to determine subnet
    // For now, scan common private IP ranges
    const commonHosts = [
      '10.0.2.2',        // Android emulator host
      '192.168.1.1',     // Common router IP
      '192.168.0.1',     // Common router IP
      '192.168.2.1',     // Common router IP
    ];
    
    // Scan 192.168.x.x range (common home networks)
    for (let subnet = 0; subnet <= 2; subnet++) {
      for (let host = 1; host <= 255; host++) {
        commonHosts.push(`192.168.${subnet}.${host}`);
      }
    }
    
    // Scan in batches to avoid overwhelming the network
    const batchSize = 50;
    for (let i = 0; i < commonHosts.length; i += batchSize) {
      const batch = commonHosts.slice(i, i + batchSize);
      const batchDevices = await this.discoverDevices(batch);
      devices.push(...batchDevices);
      
      // If we found devices, stop scanning
      if (devices.length > 0) {
        break;
      }
    }
    
    return devices;
  }
}

// Singleton instance
let shadowdServiceInstance: ShadowdService | null = null;

/**
 * Get shadowd service singleton instance
 */
export function getShadowdService(): ShadowdService {
  if (!shadowdServiceInstance) {
    shadowdServiceInstance = new ShadowdService();
  }
  return shadowdServiceInstance;
}
