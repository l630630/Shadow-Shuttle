/**
 * ConfigValidator Unit Tests
 * 
 * Tests validation logic for WireGuard configuration data.
 */

import { ConfigValidator } from '../ConfigValidator';
import { WireGuardConfig } from '../../interfaces/IConfigParser';
import { ValidationErrorCode } from '../../interfaces/IConfigValidator';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('validate()', () => {
    it('should validate a complete valid configuration', () => {
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=',
          address: '100.64.0.2/32',
          dns: '100.100.100.100',
          mtu: 1420,
          listenPort: 51820,
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '100.64.0.0/10',
          persistentKeepalive: 25,
        },
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a minimal valid configuration', () => {
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=',
          address: '100.64.0.2/32',
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '100.64.0.0/10',
        },
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject config with missing interface section', () => {
      const config = {
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '100.64.0.0/10',
        },
      } as any;

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('interface');
      expect(result.errors[0].code).toBe(ValidationErrorCode.MISSING_FIELD);
    });

    it('should reject config with missing peer section', () => {
      const config = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=',
          address: '100.64.0.2/32',
        },
      } as any;

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('peer');
      expect(result.errors[0].code).toBe(ValidationErrorCode.MISSING_FIELD);
    });

    it('should reject config with missing required interface fields', () => {
      const config: WireGuardConfig = {
        interface: {
          privateKey: '',
          address: '',
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '100.64.0.0/10',
        },
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors.some(e => e.field === 'interface.privateKey')).toBe(true);
      expect(result.errors.some(e => e.field === 'interface.address')).toBe(true);
    });

    it('should reject config with missing required peer fields', () => {
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=',
          address: '100.64.0.2/32',
        },
        peer: {
          publicKey: '',
          endpoint: '',
          allowedIPs: '',
        },
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors.some(e => e.field === 'peer.publicKey')).toBe(true);
      expect(result.errors.some(e => e.field === 'peer.endpoint')).toBe(true);
      expect(result.errors.some(e => e.field === 'peer.allowedIPs')).toBe(true);
    });

    it('should collect multiple validation errors', () => {
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'invalid-key',
          address: 'invalid-address',
          mtu: 999, // Too low
        },
        peer: {
          publicKey: 'invalid-key',
          endpoint: 'invalid-endpoint',
          allowedIPs: 'invalid-ips',
        },
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('validatePrivateKey()', () => {
    it('should accept valid private key', () => {
      expect(validator.validatePrivateKey('YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=')).toBe(true);
      expect(validator.validatePrivateKey('sO3wWLgh/JmYvBDNQnwKSlVMd0jYXMCDjwoh4+ow5uE=')).toBe(true);
    });

    it('should reject invalid private key formats', () => {
      expect(validator.validatePrivateKey('')).toBe(false);
      expect(validator.validatePrivateKey('too-short=')).toBe(false);
      expect(validator.validatePrivateKey('YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I')).toBe(false); // Missing =
      expect(validator.validatePrivateKey('YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I==')).toBe(false); // Double =
      expect(validator.validatePrivateKey('YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=extra')).toBe(false);
    });
  });

  describe('validatePublicKey()', () => {
    it('should accept valid public key', () => {
      expect(validator.validatePublicKey('HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=')).toBe(true);
    });

    it('should reject invalid public key formats', () => {
      expect(validator.validatePublicKey('')).toBe(false);
      expect(validator.validatePublicKey('invalid')).toBe(false);
      expect(validator.validatePublicKey('HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw')).toBe(false);
    });
  });

  describe('validateAddress()', () => {
    it('should accept valid CIDR addresses', () => {
      expect(validator.validateAddress('100.64.0.2/32')).toBe(true);
      expect(validator.validateAddress('10.0.0.1/24')).toBe(true);
      expect(validator.validateAddress('192.168.1.100/16')).toBe(true);
      expect(validator.validateAddress('0.0.0.0/0')).toBe(true);
      expect(validator.validateAddress('255.255.255.255/32')).toBe(true);
    });

    it('should reject invalid CIDR addresses', () => {
      expect(validator.validateAddress('100.64.0.2')).toBe(false); // Missing prefix
      expect(validator.validateAddress('100.64.0.2/33')).toBe(false); // Invalid prefix
      expect(validator.validateAddress('256.0.0.1/24')).toBe(false); // Invalid octet
      expect(validator.validateAddress('10.0.0.1/-1')).toBe(false); // Negative prefix
      expect(validator.validateAddress('10.0.0/24')).toBe(false); // Missing octet
      expect(validator.validateAddress('invalid')).toBe(false);
    });
  });

  describe('validateEndpoint()', () => {
    it('should accept valid endpoints', () => {
      expect(validator.validateEndpoint('vpn.example.com:51820')).toBe(true);
      expect(validator.validateEndpoint('192.168.1.1:51820')).toBe(true);
      expect(validator.validateEndpoint('sub.domain.example.com:443')).toBe(true);
      expect(validator.validateEndpoint('localhost:8080')).toBe(true);
    });

    it('should reject invalid endpoints', () => {
      expect(validator.validateEndpoint('vpn.example.com')).toBe(false); // Missing port
      expect(validator.validateEndpoint(':51820')).toBe(false); // Missing host
      expect(validator.validateEndpoint('vpn.example.com:0')).toBe(false); // Invalid port
      expect(validator.validateEndpoint('vpn.example.com:65536')).toBe(false); // Port too high
      expect(validator.validateEndpoint('vpn.example.com:-1')).toBe(false); // Negative port
      expect(validator.validateEndpoint('invalid')).toBe(false);
    });
  });

  describe('validateAllowedIPs()', () => {
    it('should accept valid allowed IPs', () => {
      expect(validator.validateAllowedIPs('100.64.0.0/10')).toBe(true);
      expect(validator.validateAllowedIPs('0.0.0.0/0')).toBe(true);
      expect(validator.validateAllowedIPs('10.0.0.0/8, 192.168.0.0/16')).toBe(true);
      expect(validator.validateAllowedIPs('100.64.0.0/10, 10.0.0.0/8, 192.168.0.0/16')).toBe(true);
    });

    it('should reject invalid allowed IPs', () => {
      expect(validator.validateAllowedIPs('')).toBe(false);
      expect(validator.validateAllowedIPs('100.64.0.0')).toBe(false); // Missing prefix
      expect(validator.validateAllowedIPs('100.64.0.0/10, invalid')).toBe(false);
      expect(validator.validateAllowedIPs('256.0.0.0/8')).toBe(false);
    });
  });

  describe('validateDNS()', () => {
    it('should accept valid DNS servers', () => {
      expect(validator.validateDNS('100.100.100.100')).toBe(true);
      expect(validator.validateDNS('8.8.8.8')).toBe(true);
      expect(validator.validateDNS('8.8.8.8, 8.8.4.4')).toBe(true);
      expect(validator.validateDNS('1.1.1.1, 1.0.0.1, 8.8.8.8')).toBe(true);
    });

    it('should reject invalid DNS servers', () => {
      expect(validator.validateDNS('')).toBe(false);
      expect(validator.validateDNS('256.0.0.1')).toBe(false);
      expect(validator.validateDNS('8.8.8.8, invalid')).toBe(false);
      expect(validator.validateDNS('8.8.8.8/24')).toBe(false); // CIDR not allowed
    });
  });

  describe('validateMTU()', () => {
    it('should accept valid MTU values', () => {
      expect(validator.validateMTU(1280)).toBe(true);
      expect(validator.validateMTU(1420)).toBe(true);
      expect(validator.validateMTU(1500)).toBe(true);
    });

    it('should reject invalid MTU values', () => {
      expect(validator.validateMTU(1279)).toBe(false); // Too low
      expect(validator.validateMTU(1501)).toBe(false); // Too high
      expect(validator.validateMTU(0)).toBe(false);
      expect(validator.validateMTU(-1)).toBe(false);
      expect(validator.validateMTU(1420.5)).toBe(false); // Not integer
    });
  });

  describe('validatePort()', () => {
    it('should accept valid port numbers', () => {
      expect(validator.validatePort(1)).toBe(true);
      expect(validator.validatePort(51820)).toBe(true);
      expect(validator.validatePort(65535)).toBe(true);
    });

    it('should reject invalid port numbers', () => {
      expect(validator.validatePort(0)).toBe(false);
      expect(validator.validatePort(-1)).toBe(false);
      expect(validator.validatePort(65536)).toBe(false);
      expect(validator.validatePort(51820.5)).toBe(false); // Not integer
    });
  });

  describe('validatePersistentKeepalive()', () => {
    it('should accept valid keepalive values', () => {
      expect(validator.validatePersistentKeepalive(0)).toBe(true);
      expect(validator.validatePersistentKeepalive(25)).toBe(true);
      expect(validator.validatePersistentKeepalive(65535)).toBe(true);
    });

    it('should reject invalid keepalive values', () => {
      expect(validator.validatePersistentKeepalive(-1)).toBe(false);
      expect(validator.validatePersistentKeepalive(65536)).toBe(false);
      expect(validator.validatePersistentKeepalive(25.5)).toBe(false); // Not integer
    });
  });

  describe('edge cases', () => {
    it('should handle config with all optional fields', () => {
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=',
          address: '100.64.0.2/32',
          dns: '8.8.8.8, 8.8.4.4',
          mtu: 1420,
          listenPort: 51820,
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '0.0.0.0/0',
          persistentKeepalive: 25,
          presharedKey: 'sO3wWLgh/JmYvBDNQnwKSlVMd0jYXMCDjwoh4+ow5uE=',
        },
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple allowed IP ranges', () => {
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=',
          address: '100.64.0.2/32',
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16',
        },
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should handle multiple DNS servers', () => {
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=',
          address: '100.64.0.2/32',
          dns: '1.1.1.1, 1.0.0.1, 8.8.8.8',
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '0.0.0.0/0',
        },
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });
  });
});
