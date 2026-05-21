/**
 * WireGuard Config Validator Implementation
 * 
 * Validates WireGuard configuration data including:
 * - Required fields presence
 * - Field format validation (keys, IPs, endpoints)
 * - Value range validation (ports, MTU, keepalive)
 */

import {
  IConfigValidator,
  ValidationResult,
  ValidationError,
  ValidationErrorCode,
} from '../interfaces/IConfigValidator';
import { WireGuardConfig } from '../interfaces/IConfigParser';

export class ConfigValidator implements IConfigValidator {
  // WireGuard key format: base64 encoded, 44 characters (32 bytes + padding)
  private readonly KEY_REGEX = /^[A-Za-z0-9+/]{43}=$/;
  
  // IPv4 address with CIDR notation
  private readonly IPV4_CIDR_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/;
  
  // IPv4 address without CIDR
  private readonly IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  
  // Endpoint format: hostname:port or IP:port
  private readonly ENDPOINT_REGEX = /^([a-zA-Z0-9.-]+):(\d+)$/;
  
  // Valid port range
  private readonly MIN_PORT = 1;
  private readonly MAX_PORT = 65535;
  
  // Valid MTU range (typical values for WireGuard)
  private readonly MIN_MTU = 1280;
  private readonly MAX_MTU = 1500;
  
  // Valid persistent keepalive range
  private readonly MIN_KEEPALIVE = 0;
  private readonly MAX_KEEPALIVE = 65535;

  validate(config: WireGuardConfig): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate Interface section
    if (!config.interface) {
      errors.push({
        field: 'interface',
        message: 'Missing [Interface] section',
        code: ValidationErrorCode.MISSING_FIELD,
      });
      return { valid: false, errors };
    }

    // Validate required Interface fields
    if (!config.interface.privateKey) {
      errors.push({
        field: 'interface.privateKey',
        message: 'Missing required field: PrivateKey',
        code: ValidationErrorCode.MISSING_FIELD,
      });
    } else if (!this.validatePrivateKey(config.interface.privateKey)) {
      errors.push({
        field: 'interface.privateKey',
        message: 'Invalid PrivateKey format (expected base64, 44 characters)',
        code: ValidationErrorCode.INVALID_FORMAT,
      });
    }

    if (!config.interface.address) {
      errors.push({
        field: 'interface.address',
        message: 'Missing required field: Address',
        code: ValidationErrorCode.MISSING_FIELD,
      });
    } else if (!this.validateAddress(config.interface.address)) {
      errors.push({
        field: 'interface.address',
        message: 'Invalid Address format (expected CIDR notation, e.g., 100.64.0.2/32)',
        code: ValidationErrorCode.INVALID_FORMAT,
      });
    }

    // Validate optional Interface fields
    if (config.interface.dns && !this.validateDNS(config.interface.dns)) {
      errors.push({
        field: 'interface.dns',
        message: 'Invalid DNS format',
        code: ValidationErrorCode.INVALID_FORMAT,
      });
    }

    if (config.interface.mtu !== undefined && !this.validateMTU(config.interface.mtu)) {
      errors.push({
        field: 'interface.mtu',
        message: `Invalid MTU value (expected ${this.MIN_MTU}-${this.MAX_MTU})`,
        code: ValidationErrorCode.INVALID_RANGE,
      });
    }

    if (config.interface.listenPort !== undefined && !this.validatePort(config.interface.listenPort)) {
      errors.push({
        field: 'interface.listenPort',
        message: `Invalid ListenPort value (expected ${this.MIN_PORT}-${this.MAX_PORT})`,
        code: ValidationErrorCode.INVALID_RANGE,
      });
    }

    // Validate Peer section
    if (!config.peer) {
      errors.push({
        field: 'peer',
        message: 'Missing [Peer] section',
        code: ValidationErrorCode.MISSING_FIELD,
      });
      return { valid: false, errors };
    }

    // Validate required Peer fields
    if (!config.peer.publicKey) {
      errors.push({
        field: 'peer.publicKey',
        message: 'Missing required field: PublicKey',
        code: ValidationErrorCode.MISSING_FIELD,
      });
    } else if (!this.validatePublicKey(config.peer.publicKey)) {
      errors.push({
        field: 'peer.publicKey',
        message: 'Invalid PublicKey format (expected base64, 44 characters)',
        code: ValidationErrorCode.INVALID_FORMAT,
      });
    }

    if (!config.peer.endpoint) {
      errors.push({
        field: 'peer.endpoint',
        message: 'Missing required field: Endpoint',
        code: ValidationErrorCode.MISSING_FIELD,
      });
    } else if (!this.validateEndpoint(config.peer.endpoint)) {
      errors.push({
        field: 'peer.endpoint',
        message: 'Invalid Endpoint format (expected host:port)',
        code: ValidationErrorCode.INVALID_FORMAT,
      });
    }

    if (!config.peer.allowedIPs) {
      errors.push({
        field: 'peer.allowedIPs',
        message: 'Missing required field: AllowedIPs',
        code: ValidationErrorCode.MISSING_FIELD,
      });
    } else if (!this.validateAllowedIPs(config.peer.allowedIPs)) {
      errors.push({
        field: 'peer.allowedIPs',
        message: 'Invalid AllowedIPs format (expected CIDR notation)',
        code: ValidationErrorCode.INVALID_FORMAT,
      });
    }

    // Validate optional Peer fields
    if (config.peer.persistentKeepalive !== undefined && 
        !this.validatePersistentKeepalive(config.peer.persistentKeepalive)) {
      errors.push({
        field: 'peer.persistentKeepalive',
        message: `Invalid PersistentKeepalive value (expected ${this.MIN_KEEPALIVE}-${this.MAX_KEEPALIVE})`,
        code: ValidationErrorCode.INVALID_RANGE,
      });
    }

    if (config.peer.presharedKey && !this.validatePrivateKey(config.peer.presharedKey)) {
      errors.push({
        field: 'peer.presharedKey',
        message: 'Invalid PresharedKey format (expected base64, 44 characters)',
        code: ValidationErrorCode.INVALID_FORMAT,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validatePrivateKey(key: string): boolean {
    return this.KEY_REGEX.test(key);
  }

  validatePublicKey(key: string): boolean {
    return this.KEY_REGEX.test(key);
  }

  validateAddress(address: string): boolean {
    const match = address.match(this.IPV4_CIDR_REGEX);
    if (!match) {
      return false;
    }

    // Validate each octet is 0-255
    for (let i = 1; i <= 4; i++) {
      const octet = parseInt(match[i], 10);
      if (octet < 0 || octet > 255) {
        return false;
      }
    }

    // Validate CIDR prefix is 0-32
    const prefix = parseInt(match[5], 10);
    return prefix >= 0 && prefix <= 32;
  }

  validateEndpoint(endpoint: string): boolean {
    const match = endpoint.match(this.ENDPOINT_REGEX);
    if (!match) {
      return false;
    }

    const port = parseInt(match[2], 10);
    return this.validatePort(port);
  }

  validateAllowedIPs(allowedIPs: string): boolean {
    // Split by comma and validate each CIDR range
    const ranges = allowedIPs.split(',').map(s => s.trim());
    
    if (ranges.length === 0) {
      return false;
    }

    for (const range of ranges) {
      if (!this.validateCIDR(range)) {
        return false;
      }
    }

    return true;
  }

  validateDNS(dns: string): boolean {
    // DNS can be a single IP or comma-separated list
    const servers = dns.split(',').map(s => s.trim());
    
    if (servers.length === 0) {
      return false;
    }

    for (const server of servers) {
      if (!this.validateIPv4(server)) {
        return false;
      }
    }

    return true;
  }

  validateMTU(mtu: number): boolean {
    return Number.isInteger(mtu) && mtu >= this.MIN_MTU && mtu <= this.MAX_MTU;
  }

  validatePort(port: number): boolean {
    return Number.isInteger(port) && port >= this.MIN_PORT && port <= this.MAX_PORT;
  }

  validatePersistentKeepalive(keepalive: number): boolean {
    return Number.isInteger(keepalive) && 
           keepalive >= this.MIN_KEEPALIVE && 
           keepalive <= this.MAX_KEEPALIVE;
  }

  /**
   * Validate CIDR notation (IP/prefix)
   */
  private validateCIDR(cidr: string): boolean {
    const match = cidr.match(this.IPV4_CIDR_REGEX);
    if (!match) {
      return false;
    }

    // Validate each octet is 0-255
    for (let i = 1; i <= 4; i++) {
      const octet = parseInt(match[i], 10);
      if (octet < 0 || octet > 255) {
        return false;
      }
    }

    // Validate CIDR prefix is 0-32
    const prefix = parseInt(match[5], 10);
    return prefix >= 0 && prefix <= 32;
  }

  /**
   * Validate IPv4 address (without CIDR)
   */
  private validateIPv4(ip: string): boolean {
    const match = ip.match(this.IPV4_REGEX);
    if (!match) {
      return false;
    }

    // Validate each octet is 0-255
    for (let i = 1; i <= 4; i++) {
      const octet = parseInt(match[i], 10);
      if (octet < 0 || octet > 255) {
        return false;
      }
    }

    return true;
  }
}
