/**
 * Unit tests for ConfigParser
 * Tests parsing, formatting, and validation of WireGuard configurations
 */

import { ConfigParser } from '../ConfigParser';
import { ConfigParseError, WireGuardConfig } from '../../interfaces/IConfigParser';

describe('ConfigParser', () => {
  let parser: ConfigParser;

  beforeEach(() => {
    parser = new ConfigParser();
  });

  describe('Parse Valid Configurations', () => {
    it('should parse minimal valid configuration', () => {
      // Arrange
      const configText = `
[Interface]
PrivateKey = YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=
Address = 10.0.0.2/24

[Peer]
PublicKey = HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
      `.trim();

      // Act
      const config = parser.parse(configText);

      // Assert
      expect(config.interface.privateKey).toBe('YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=');
      expect(config.interface.address).toBe('10.0.0.2/24');
      expect(config.peer.publicKey).toBe('HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=');
      expect(config.peer.endpoint).toBe('vpn.example.com:51820');
      expect(config.peer.allowedIPs).toBe('0.0.0.0/0');
    });

    it('should parse configuration with all optional fields', () => {
      // Arrange
      const configText = `
[Interface]
PrivateKey = YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=
Address = 10.0.0.2/24
DNS = 1.1.1.1
MTU = 1420
ListenPort = 51820

[Peer]
PublicKey = HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
PresharedKey = gI6EdUSYvn8ugXOt8QQD6Yc+JyK3wgm0VXtg7O0Qclw=
      `.trim();

      // Act
      const config = parser.parse(configText);

      // Assert
      expect(config.interface.dns).toBe('1.1.1.1');
      expect(config.interface.mtu).toBe(1420);
      expect(config.interface.listenPort).toBe(51820);
      expect(config.peer.persistentKeepalive).toBe(25);
      expect(config.peer.presharedKey).toBe('gI6EdUSYvn8ugXOt8QQD6Yc+JyK3wgm0VXtg7O0Qclw=');
    });

    it('should handle comments and empty lines', () => {
      // Arrange
      const configText = `
# This is a comment
[Interface]
# Interface configuration
PrivateKey = YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=
Address = 10.0.0.2/24

; Another comment style
[Peer]
PublicKey = HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
      `.trim();

      // Act
      const config = parser.parse(configText);

      // Assert
      expect(config.interface.privateKey).toBe('YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=');
      expect(config.peer.publicKey).toBe('HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=');
    });

    it('should handle case-insensitive keys', () => {
      // Arrange
      const configText = `
[Interface]
privatekey = YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=
address = 10.0.0.2/24

[Peer]
publickey = HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=
endpoint = vpn.example.com:51820
allowedips = 0.0.0.0/0
      `.trim();

      // Act
      const config = parser.parse(configText);

      // Assert
      expect(config.interface.privateKey).toBe('YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=');
      expect(config.peer.allowedIPs).toBe('0.0.0.0/0');
    });
  });

  describe('Parse Invalid Configurations', () => {
    it('should throw error for missing Interface section', () => {
      // Arrange
      const configText = `
[Peer]
PublicKey = HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
      `.trim();

      // Act & Assert
      expect(() => parser.parse(configText)).toThrow(ConfigParseError);
      expect(() => parser.parse(configText)).toThrow('Missing required field: PrivateKey');
    });

    it('should throw error for missing Peer section', () => {
      // Arrange
      const configText = `
[Interface]
PrivateKey = YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=
Address = 10.0.0.2/24
      `.trim();

      // Act & Assert
      expect(() => parser.parse(configText)).toThrow(ConfigParseError);
      expect(() => parser.parse(configText)).toThrow('Missing required field: PublicKey');
    });

    it('should throw error for missing PrivateKey', () => {
      // Arrange
      const configText = `
[Interface]
Address = 10.0.0.2/24

[Peer]
PublicKey = HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
      `.trim();

      // Act & Assert
      expect(() => parser.parse(configText)).toThrow('Missing required field: PrivateKey');
    });

    it('should throw error for invalid line format', () => {
      // Arrange
      const configText = `
[Interface]
PrivateKey = YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=
InvalidLine
Address = 10.0.0.2/24
      `.trim();

      // Act & Assert
      expect(() => parser.parse(configText)).toThrow('Invalid line format');
    });

    it('should throw error for unknown section', () => {
      // Arrange
      const configText = `
[UnknownSection]
Key = Value
      `.trim();

      // Act & Assert
      expect(() => parser.parse(configText)).toThrow('Unknown section');
    });

    it('should throw error for key-value outside section', () => {
      // Arrange
      const configText = `
PrivateKey = YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=
[Interface]
Address = 10.0.0.2/24
      `.trim();

      // Act & Assert
      expect(() => parser.parse(configText)).toThrow('Key-value pair outside of section');
    });
  });

  describe('Format Configuration', () => {
    it('should format minimal configuration', () => {
      // Arrange
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=',
          address: '10.0.0.2/24',
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '0.0.0.0/0',
        },
      };

      // Act
      const formatted = parser.format(config);

      // Assert
      expect(formatted).toContain('[Interface]');
      expect(formatted).toContain('PrivateKey = YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=');
      expect(formatted).toContain('Address = 10.0.0.2/24');
      expect(formatted).toContain('[Peer]');
      expect(formatted).toContain('PublicKey = HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=');
      expect(formatted).toContain('Endpoint = vpn.example.com:51820');
      expect(formatted).toContain('AllowedIPs = 0.0.0.0/0');
    });

    it('should format configuration with optional fields', () => {
      // Arrange
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=',
          address: '10.0.0.2/24',
          dns: '1.1.1.1',
          mtu: 1420,
          listenPort: 51820,
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '0.0.0.0/0',
          persistentKeepalive: 25,
        },
      };

      // Act
      const formatted = parser.format(config);

      // Assert
      expect(formatted).toContain('DNS = 1.1.1.1');
      expect(formatted).toContain('MTU = 1420');
      expect(formatted).toContain('ListenPort = 51820');
      expect(formatted).toContain('PersistentKeepalive = 25');
    });
  });

  describe('Round-trip (Parse and Format)', () => {
    it('should maintain data integrity through parse and format', () => {
      // Arrange
      const originalConfig: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=',
          address: '10.0.0.2/24',
          dns: '1.1.1.1',
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '0.0.0.0/0',
          persistentKeepalive: 25,
        },
      };

      // Act
      const formatted = parser.format(originalConfig);
      const parsed = parser.parse(formatted);

      // Assert
      expect(parsed).toEqual(originalConfig);
    });
  });

  describe('Validate Configuration', () => {
    it('should validate correct configuration', () => {
      // Arrange
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=',
          address: '10.0.0.2/24',
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '0.0.0.0/0',
        },
      };

      // Act & Assert
      expect(parser.validate(config)).toBe(true);
    });

    it('should throw error for invalid private key format', () => {
      // Arrange
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'invalid-key',
          address: '10.0.0.2/24',
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '0.0.0.0/0',
        },
      };

      // Act & Assert
      expect(() => parser.validate(config)).toThrow('Invalid PrivateKey format');
    });

    it('should throw error for invalid address format', () => {
      // Arrange
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=',
          address: 'invalid-address',
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'vpn.example.com:51820',
          allowedIPs: '0.0.0.0/0',
        },
      };

      // Act & Assert
      expect(() => parser.validate(config)).toThrow('Invalid Address format');
    });

    it('should throw error for invalid endpoint format', () => {
      // Arrange
      const config: WireGuardConfig = {
        interface: {
          privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au4+4WzFE=',
          address: '10.0.0.2/24',
        },
        peer: {
          publicKey: 'HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=',
          endpoint: 'invalid-endpoint',
          allowedIPs: '0.0.0.0/0',
        },
      };

      // Act & Assert
      expect(() => parser.validate(config)).toThrow('Invalid Endpoint format');
    });
  });
});
