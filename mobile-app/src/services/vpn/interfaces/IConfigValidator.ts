/**
 * Config Validator Interface
 * 
 * Abstraction for validating WireGuard configuration data.
 * Validates field formats, required fields, and data integrity.
 */

import { WireGuardConfig } from './IConfigParser';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: ValidationErrorCode;
}

export enum ValidationErrorCode {
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_VALUE = 'INVALID_VALUE',
  INVALID_RANGE = 'INVALID_RANGE',
}

export interface IConfigValidator {
  /**
   * Validate WireGuard configuration
   * @param config - Configuration to validate
   * @returns Validation result with errors if any
   */
  validate(config: WireGuardConfig): ValidationResult;

  /**
   * Validate private key format
   * @param key - Base64 encoded private key
   * @returns true if valid
   */
  validatePrivateKey(key: string): boolean;

  /**
   * Validate public key format
   * @param key - Base64 encoded public key
   * @returns true if valid
   */
  validatePublicKey(key: string): boolean;

  /**
   * Validate IP address with CIDR notation
   * @param address - IP address in CIDR format (e.g., "100.64.0.2/32")
   * @returns true if valid
   */
  validateAddress(address: string): boolean;

  /**
   * Validate endpoint format
   * @param endpoint - Endpoint in host:port format
   * @returns true if valid
   */
  validateEndpoint(endpoint: string): boolean;

  /**
   * Validate allowed IPs format
   * @param allowedIPs - Comma-separated CIDR ranges
   * @returns true if valid
   */
  validateAllowedIPs(allowedIPs: string): boolean;

  /**
   * Validate DNS server format
   * @param dns - DNS server IP address or comma-separated list
   * @returns true if valid
   */
  validateDNS(dns: string): boolean;

  /**
   * Validate MTU value
   * @param mtu - Maximum Transmission Unit
   * @returns true if valid
   */
  validateMTU(mtu: number): boolean;

  /**
   * Validate port number
   * @param port - Port number
   * @returns true if valid
   */
  validatePort(port: number): boolean;

  /**
   * Validate persistent keepalive value
   * @param keepalive - Keepalive interval in seconds
   * @returns true if valid
   */
  validatePersistentKeepalive(keepalive: number): boolean;
}
