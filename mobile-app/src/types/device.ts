/**
 * Device types for Shadow Shuttle mobile app
 */

export interface Device {
  id: string;
  name: string;
  hostname: string;
  os: string;
  meshIP: string;
  sshPort: number;
  grpcPort: number;
  publicKey: string;
  online: boolean;
  lastSeen: Date;
}

export interface PairingCode {
  deviceId: string;
  meshIP: string;
  sshPort: number;
  grpcPort: number;
  publicKey: string;
  timestamp: number;
  signature: string;
}

export interface ConnectionStatus {
  connected: boolean;
  meshIP?: string;
  error?: string;
}

export interface HealthStatus {
  healthy: boolean;
  uptime: number;
  lastHeartbeat: Date;
}
