/**
 * mDNS/Bonjour Service Discovery
 * Automatically discovers shadowd instances on the local network
 */

import Zeroconf from 'react-native-zeroconf';
import { Device } from '../types/device';

export interface MDNSDevice {
  name: string;
  host: string;
  addresses: string[];
  port: number;
  txt: Record<string, string>;
}

export class MDNSService {
  private zeroconf: Zeroconf;
  private isScanning: boolean = false;

  constructor() {
    this.zeroconf = new Zeroconf();
  }

  /**
   * Discover shadowd devices on the local network
   * @param timeout Scan timeout in milliseconds (default: 5000)
   * @returns Promise<Device[]>
   */
  async discoverDevices(timeout: number = 5000): Promise<Device[]> {
    if (this.isScanning) {
      console.warn('[MDNSService] Already scanning, skipping...');
      return [];
    }

    return new Promise((resolve) => {
      const devices: Device[] = [];
      const discoveredHosts = new Set<string>();

      this.isScanning = true;

      // Listen for resolved services
      this.zeroconf.on('resolved', (service: any) => {
        console.log('[MDNSService] Service resolved:', service);

        // Extract device information
        const name = service.name || 'Unknown Device';
        const addresses = service.addresses || [];
        const port = service.port || 8080;
        const txt = service.txt || {};

        // Get the first IPv4 address
        const ipv4Address = addresses.find((addr: string) => {
          // Check if it's an IPv4 address (not IPv6)
          return addr.includes('.') && !addr.includes(':');
        });

        if (!ipv4Address) {
          console.warn('[MDNSService] No IPv4 address found for', name);
          return;
        }

        // Avoid duplicates
        if (discoveredHosts.has(ipv4Address)) {
          return;
        }
        discoveredHosts.add(ipv4Address);

        // Parse TXT records
        const meshIP = txt.mesh_ip || ipv4Address;
        const sshPort = parseInt(txt.ssh_port || '2222', 10);
        const grpcPort = parseInt(txt.grpc_port || '50052', 10);
        const wsPort = parseInt(txt.ws_port || '8022', 10);

        // Create device object
        const device: Device = {
          id: `${name}-${Date.now()}`,
          name: name,
          hostname: service.host || name,
          meshIP: ipv4Address, // Use the discovered IP
          sshPort: wsPort, // Use WebSocket SSH proxy port
          grpcPort: grpcPort,
          publicKey: '',
          online: true,
          lastSeen: new Date(),
        };

        devices.push(device);
        console.log('[MDNSService] Device discovered:', device);
      });

      // Listen for errors
      this.zeroconf.on('error', (error: any) => {
        console.error('[MDNSService] Error:', error);
      });

      // Listen for scan stop
      this.zeroconf.on('stop', () => {
        console.log('[MDNSService] Scan stopped, found', devices.length, 'devices');
        this.isScanning = false;
        resolve(devices);
      });

      // Start scanning
      console.log('[MDNSService] Starting scan for _shadowd._tcp services...');
      this.zeroconf.scan('shadowd', 'tcp', 'local.');

      // Stop scanning after timeout
      setTimeout(() => {
        if (this.isScanning) {
          console.log('[MDNSService] Scan timeout, stopping...');
          this.stop();
        }
      }, timeout);
    });
  }

  /**
   * Stop scanning
   */
  stop() {
    if (this.isScanning) {
      console.log('[MDNSService] Stopping scan...');
      this.zeroconf.stop();
      this.isScanning = false;
    }
  }

  /**
   * Remove all listeners
   */
  cleanup() {
    this.stop();
    this.zeroconf.removeAllListeners();
  }
}

// Singleton instance
let mdnsServiceInstance: MDNSService | null = null;

/**
 * Get mDNS service singleton instance
 */
export function getMDNSService(): MDNSService {
  if (!mdnsServiceInstance) {
    mdnsServiceInstance = new MDNSService();
  }
  return mdnsServiceInstance;
}
