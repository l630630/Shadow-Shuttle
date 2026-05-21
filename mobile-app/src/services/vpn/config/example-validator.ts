/**
 * ConfigValidator Usage Examples
 * 
 * Demonstrates how to use the ConfigValidator module.
 */

import { ConfigValidator } from './ConfigValidator';
import { WireGuardConfig } from '../interfaces/IConfigParser';

// Create validator instance
const validator = new ConfigValidator();

// Example 1: Validate a complete configuration
const validConfig: WireGuardConfig = {
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

const result1 = validator.validate(validConfig);
console.log('Valid config:', result1.valid); // true
console.log('Errors:', result1.errors); // []

// Example 2: Validate configuration with errors
const invalidConfig: WireGuardConfig = {
  interface: {
    privateKey: 'invalid-key',
    address: 'invalid-address',
  },
  peer: {
    publicKey: 'invalid-key',
    endpoint: 'invalid-endpoint',
    allowedIPs: 'invalid-ips',
  },
};

const result2 = validator.validate(invalidConfig);
console.log('Valid config:', result2.valid); // false
console.log('Errors:', result2.errors);
// [
//   { field: 'interface.privateKey', message: '...', code: 'INVALID_FORMAT' },
//   { field: 'interface.address', message: '...', code: 'INVALID_FORMAT' },
//   { field: 'peer.publicKey', message: '...', code: 'INVALID_FORMAT' },
//   { field: 'peer.endpoint', message: '...', code: 'INVALID_FORMAT' },
//   { field: 'peer.allowedIPs', message: '...', code: 'INVALID_FORMAT' }
// ]

// Example 3: Validate individual fields
console.log('Valid private key:', validator.validatePrivateKey('YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=')); // true
console.log('Valid address:', validator.validateAddress('100.64.0.2/32')); // true
console.log('Valid endpoint:', validator.validateEndpoint('vpn.example.com:51820')); // true
console.log('Valid DNS:', validator.validateDNS('8.8.8.8, 8.8.4.4')); // true
console.log('Valid MTU:', validator.validateMTU(1420)); // true

// Example 4: Use in a configuration manager
class ConfigManager {
  constructor(private validator: ConfigValidator) {}

  async saveConfig(config: WireGuardConfig): Promise<void> {
    const result = this.validator.validate(config);
    
    if (!result.valid) {
      const errorMessages = result.errors.map(e => `${e.field}: ${e.message}`).join('\n');
      throw new Error(`Invalid configuration:\n${errorMessages}`);
    }

    // Save config...
    console.log('Config saved successfully');
  }
}

// Example 5: User-friendly error display
function displayValidationErrors(result: ReturnType<typeof validator.validate>): void {
  if (result.valid) {
    console.log('✓ Configuration is valid');
    return;
  }

  console.log('✗ Configuration has errors:');
  for (const error of result.errors) {
    console.log(`  - ${error.field}: ${error.message}`);
  }
}

displayValidationErrors(result1);
displayValidationErrors(result2);

// Example 6: Validate before connecting
async function connectVPN(config: WireGuardConfig): Promise<void> {
  const result = validator.validate(config);
  
  if (!result.valid) {
    throw new Error('Cannot connect: Invalid configuration');
  }

  // Proceed with connection...
  console.log('Connecting to VPN...');
}

// Example 7: Validate configuration from API
async function registerDevice(url: string, key: string, name: string): Promise<WireGuardConfig> {
  // Fetch config from API...
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

  // Validate before returning
  const result = validator.validate(config);
  if (!result.valid) {
    throw new Error('Server returned invalid configuration');
  }

  return config;
}
