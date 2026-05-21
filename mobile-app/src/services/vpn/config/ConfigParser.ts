/**
 * WireGuard Config Parser Implementation
 * 
 * Parses and formats WireGuard INI configuration files.
 * Supports [Interface] and [Peer] sections.
 */

import {
  IConfigParser,
  WireGuardConfig,
  WireGuardInterface,
  WireGuardPeer,
  ConfigParseError,
} from '../interfaces/IConfigParser';

export class ConfigParser implements IConfigParser {
  parse(configText: string): WireGuardConfig {
    const lines = configText.split('\n').map(line => line.trim());
    
    let currentSection: 'interface' | 'peer' | null = null;
    const interfaceData: Partial<WireGuardInterface> = {};
    const peerData: Partial<WireGuardPeer> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#') || line.startsWith(';')) {
        continue;
      }
      
      // Check for section headers
      if (line.startsWith('[') && line.endsWith(']')) {
        const section = line.slice(1, -1).toLowerCase();
        if (section === 'interface') {
          currentSection = 'interface';
        } else if (section === 'peer') {
          currentSection = 'peer';
        } else {
          throw new ConfigParseError(`Unknown section: ${section}`, lineNumber);
        }
        continue;
      }
      
      // Parse key-value pairs
      const equalIndex = line.indexOf('=');
      if (equalIndex === -1) {
        throw new ConfigParseError(`Invalid line format: ${line}`, lineNumber);
      }
      
      const key = line.slice(0, equalIndex).trim();
      const value = line.slice(equalIndex + 1).trim();
      
      if (!key || !value) {
        throw new ConfigParseError(`Empty key or value: ${line}`, lineNumber);
      }
      
      // Assign to appropriate section
      if (currentSection === 'interface') {
        this.parseInterfaceField(interfaceData, key, value, lineNumber);
      } else if (currentSection === 'peer') {
        this.parsePeerField(peerData, key, value, lineNumber);
      } else {
        throw new ConfigParseError(`Key-value pair outside of section: ${line}`, lineNumber);
      }
    }
    
    // Validate required fields
    if (!interfaceData.privateKey) {
      throw new ConfigParseError('Missing required field: PrivateKey in [Interface]');
    }
    if (!interfaceData.address) {
      throw new ConfigParseError('Missing required field: Address in [Interface]');
    }
    if (!peerData.publicKey) {
      throw new ConfigParseError('Missing required field: PublicKey in [Peer]');
    }
    if (!peerData.endpoint) {
      throw new ConfigParseError('Missing required field: Endpoint in [Peer]');
    }
    if (!peerData.allowedIPs) {
      throw new ConfigParseError('Missing required field: AllowedIPs in [Peer]');
    }
    
    return {
      interface: interfaceData as WireGuardInterface,
      peer: peerData as WireGuardPeer,
    };
  }

  format(config: WireGuardConfig): string {
    const lines: string[] = [];
    
    // [Interface] section
    lines.push('[Interface]');
    lines.push(`PrivateKey = ${config.interface.privateKey}`);
    lines.push(`Address = ${config.interface.address}`);
    
    if (config.interface.dns) {
      lines.push(`DNS = ${config.interface.dns}`);
    }
    if (config.interface.mtu) {
      lines.push(`MTU = ${config.interface.mtu}`);
    }
    if (config.interface.listenPort) {
      lines.push(`ListenPort = ${config.interface.listenPort}`);
    }
    
    lines.push('');
    
    // [Peer] section
    lines.push('[Peer]');
    lines.push(`PublicKey = ${config.peer.publicKey}`);
    lines.push(`Endpoint = ${config.peer.endpoint}`);
    lines.push(`AllowedIPs = ${config.peer.allowedIPs}`);
    
    if (config.peer.persistentKeepalive) {
      lines.push(`PersistentKeepalive = ${config.peer.persistentKeepalive}`);
    }
    if (config.peer.presharedKey) {
      lines.push(`PresharedKey = ${config.peer.presharedKey}`);
    }
    
    return lines.join('\n');
  }

  validate(config: WireGuardConfig): boolean {
    // Validate Interface
    if (!config.interface) {
      throw new ConfigParseError('Missing [Interface] section');
    }
    if (!config.interface.privateKey) {
      throw new ConfigParseError('Missing PrivateKey in [Interface]');
    }
    if (!config.interface.address) {
      throw new ConfigParseError('Missing Address in [Interface]');
    }
    
    // Validate private key format (base64, 44 characters)
    if (!/^[A-Za-z0-9+/]{43}=$/.test(config.interface.privateKey)) {
      throw new ConfigParseError('Invalid PrivateKey format');
    }
    
    // Validate address format (CIDR notation)
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(config.interface.address)) {
      throw new ConfigParseError('Invalid Address format (expected CIDR notation)');
    }
    
    // Validate Peer
    if (!config.peer) {
      throw new ConfigParseError('Missing [Peer] section');
    }
    if (!config.peer.publicKey) {
      throw new ConfigParseError('Missing PublicKey in [Peer]');
    }
    if (!config.peer.endpoint) {
      throw new ConfigParseError('Missing Endpoint in [Peer]');
    }
    if (!config.peer.allowedIPs) {
      throw new ConfigParseError('Missing AllowedIPs in [Peer]');
    }
    
    // Validate public key format
    if (!/^[A-Za-z0-9+/]{43}=$/.test(config.peer.publicKey)) {
      throw new ConfigParseError('Invalid PublicKey format');
    }
    
    // Validate endpoint format (host:port)
    if (!/^[a-zA-Z0-9.-]+:\d+$/.test(config.peer.endpoint)) {
      throw new ConfigParseError('Invalid Endpoint format (expected host:port)');
    }
    
    return true;
  }

  private parseInterfaceField(
    data: Partial<WireGuardInterface>,
    key: string,
    value: string,
    lineNumber: number
  ): void {
    const lowerKey = key.toLowerCase();
    
    switch (lowerKey) {
      case 'privatekey':
        data.privateKey = value;
        break;
      case 'address':
        data.address = value;
        break;
      case 'dns':
        data.dns = value;
        break;
      case 'mtu':
        data.mtu = parseInt(value, 10);
        if (isNaN(data.mtu)) {
          throw new ConfigParseError(`Invalid MTU value: ${value}`, lineNumber);
        }
        break;
      case 'listenport':
        data.listenPort = parseInt(value, 10);
        if (isNaN(data.listenPort)) {
          throw new ConfigParseError(`Invalid ListenPort value: ${value}`, lineNumber);
        }
        break;
      default:
        // Ignore unknown fields
        console.warn(`Unknown Interface field: ${key}`);
    }
  }

  private parsePeerField(
    data: Partial<WireGuardPeer>,
    key: string,
    value: string,
    lineNumber: number
  ): void {
    const lowerKey = key.toLowerCase();
    
    switch (lowerKey) {
      case 'publickey':
        data.publicKey = value;
        break;
      case 'endpoint':
        data.endpoint = value;
        break;
      case 'allowedips':
        data.allowedIPs = value;
        break;
      case 'persistentkeepalive':
        data.persistentKeepalive = parseInt(value, 10);
        if (isNaN(data.persistentKeepalive)) {
          throw new ConfigParseError(`Invalid PersistentKeepalive value: ${value}`, lineNumber);
        }
        break;
      case 'presharedkey':
        data.presharedKey = value;
        break;
      default:
        // Ignore unknown fields
        console.warn(`Unknown Peer field: ${key}`);
    }
  }
}
