/**
 * Config Parser Interface
 * 
 * Abstraction for parsing and formatting WireGuard configuration files.
 * Supports INI format used by WireGuard.
 */

export interface WireGuardInterface {
  privateKey: string;
  address: string;
  dns?: string;
  mtu?: number;
  listenPort?: number;
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
  peer: WireGuardPeer;
}

export class ConfigParseError extends Error {
  constructor(message: string, public line?: number) {
    super(message);
    this.name = 'ConfigParseError';
  }
}

export interface IConfigParser {
  /**
   * Parse WireGuard INI format configuration
   * @param configText - INI format configuration string
   * @returns Parsed configuration object
   */
  parse(configText: string): WireGuardConfig;

  /**
   * Format configuration object to INI string
   * @param config - Configuration object
   * @returns INI format string
   */
  format(config: WireGuardConfig): string;

  /**
   * Validate configuration object
   * @param config - Configuration to validate
   * @returns true if valid, throws error otherwise
   */
  validate(config: WireGuardConfig): boolean;
}
