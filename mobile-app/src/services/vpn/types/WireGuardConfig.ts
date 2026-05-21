/**
 * WireGuard Configuration Types
 */

export interface WireGuardInterface {
  privateKey: string;
  address: string;
  dns?: string;
  mtu?: number;
}

export interface WireGuardPeer {
  publicKey: string;
  endpoint: string;
  allowedIPs: string;
  persistentKeepalive?: number;
  presharedKey?: string;
}

export interface WireGuardConfig {
  interface: WireGuardInterface;
  peers: WireGuardPeer[];
}

/**
 * Headscale API Types
 */

export interface HeadscaleRegisterRequest {
  deviceName: string;
  preAuthKey: string;
}

export interface HeadscaleRegisterResponse {
  nodeId: string;
  nodeName: string;
  meshIP: string;
  message?: string;
}

export interface HeadscaleConfigResponse {
  config: string; // WireGuard INI format
  meshIP: string;
  nodeId: string;
}
