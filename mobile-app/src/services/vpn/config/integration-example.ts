/**
 * Config Parser + Validator Integration Example
 * 
 * Demonstrates how ConfigParser and ConfigValidator work together.
 */

import { ConfigParser } from './ConfigParser';
import { ConfigValidator } from './ConfigValidator';

// Create instances
const parser = new ConfigParser();
const validator = new ConfigValidator();

// Example 1: Parse and validate a configuration string
const configText = `
[Interface]
PrivateKey = YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=
Address = 100.64.0.2/32
DNS = 100.100.100.100

[Peer]
PublicKey = HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=
Endpoint = vpn.example.com:51820
AllowedIPs = 100.64.0.0/10
PersistentKeepalive = 25
`;

try {
  // Step 1: Parse the configuration
  const config = parser.parse(configText);
  console.log('✓ Configuration parsed successfully');

  // Step 2: Validate the parsed configuration
  const result = validator.validate(config);
  
  if (result.valid) {
    console.log('✓ Configuration is valid');
    console.log('Ready to connect!');
  } else {
    console.log('✗ Configuration has errors:');
    for (const error of result.errors) {
      console.log(`  - ${error.field}: ${error.message}`);
    }
  }
} catch (error) {
  console.error('Failed to parse configuration:', error);
}

// Example 2: Handle invalid configuration
const invalidConfigText = `
[Interface]
PrivateKey = invalid-key
Address = invalid-address

[Peer]
PublicKey = invalid-key
Endpoint = invalid-endpoint
AllowedIPs = invalid-ips
`;

try {
  const config = parser.parse(invalidConfigText);
  const result = validator.validate(config);
  
  if (!result.valid) {
    console.log('\nValidation errors found:');
    result.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.field}`);
      console.log(`   ${error.message}`);
      console.log(`   Code: ${error.code}`);
    });
  }
} catch (error) {
  console.error('Parse error:', error);
}

// Example 3: Validate before formatting
function safeFormatConfig(config: any): string {
  // Validate first
  const result = validator.validate(config);
  
  if (!result.valid) {
    const errorList = result.errors.map(e => e.message).join(', ');
    throw new Error(`Cannot format invalid config: ${errorList}`);
  }

  // Format if valid
  return parser.format(config);
}

// Example 4: Complete workflow - Parse, Validate, Format
function processConfig(inputText: string): string {
  // Parse
  const config = parser.parse(inputText);
  
  // Validate
  const result = validator.validate(config);
  if (!result.valid) {
    throw new Error('Invalid configuration');
  }

  // Format (normalize)
  return parser.format(config);
}

// Example 5: Validate API response
async function fetchAndValidateConfig(url: string): Promise<any> {
  const response = await fetch(url);
  const configText = await response.text();

  // Parse
  const config = parser.parse(configText);

  // Validate
  const result = validator.validate(config);
  if (!result.valid) {
    throw new Error('Server returned invalid configuration');
  }

  return config;
}

// Example 6: Pre-connection validation
async function connectToVPN(configText: string): Promise<void> {
  // Parse
  let config;
  try {
    config = parser.parse(configText);
  } catch (error) {
    throw new Error(`Configuration parse error: ${error.message}`);
  }

  // Validate
  const result = validator.validate(config);
  if (!result.valid) {
    const errors = result.errors.map(e => `${e.field}: ${e.message}`).join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  // Connect (implementation would go here)
  console.log('Connecting to VPN with validated configuration...');
}

// Example 7: Incremental validation during user input
function validateField(fieldName: string, value: any): boolean {
  switch (fieldName) {
    case 'privateKey':
      return validator.validatePrivateKey(value);
    case 'publicKey':
      return validator.validatePublicKey(value);
    case 'address':
      return validator.validateAddress(value);
    case 'endpoint':
      return validator.validateEndpoint(value);
    case 'dns':
      return validator.validateDNS(value);
    case 'mtu':
      return validator.validateMTU(value);
    case 'port':
      return validator.validatePort(value);
    default:
      return true;
  }
}

// Example usage in a form
const userInputs = {
  privateKey: 'YAnz5TF+lXXJte14tji3zlMNftft3YK4D4Au+Dmzh0I=',
  address: '100.64.0.2/32',
  endpoint: 'vpn.example.com:51820',
};

for (const [field, value] of Object.entries(userInputs)) {
  const isValid = validateField(field, value);
  console.log(`${field}: ${isValid ? '✓' : '✗'}`);
}

export {
  parser,
  validator,
  safeFormatConfig,
  processConfig,
  fetchAndValidateConfig,
  connectToVPN,
  validateField,
};
