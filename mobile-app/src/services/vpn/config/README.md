# VPN Config Module

Comprehensive WireGuard configuration parsing and validation module.

## Overview

This module provides tools for parsing, validating, and formatting WireGuard VPN configurations. It consists of two main components:

1. **ConfigParser**: Parses and formats WireGuard INI configuration files
2. **ConfigValidator**: Validates configuration data for correctness and completeness

## Features

### ConfigParser
- ✅ Parse WireGuard INI format
- ✅ Format configuration objects to INI strings
- ✅ Support [Interface] and [Peer] sections
- ✅ Handle comments and empty lines
- ✅ Case-insensitive key names
- ✅ Comprehensive error reporting with line numbers

### ConfigValidator
- ✅ Validate required fields
- ✅ Validate field formats (keys, IPs, endpoints)
- ✅ Validate value ranges (ports, MTU, keepalive)
- ✅ Collect all validation errors
- ✅ Granular validation methods
- ✅ Structured error reporting

## Installation

```typescript
import {
  ConfigParser,
  ConfigValidator,
  WireGuardConfig,
  ValidationResult,
} from './config';
```

## Quick Start

### Parse and Validate

```typescript
import { ConfigParser, ConfigValidator } from './config';

const parser = new ConfigParser();
const validator = new ConfigValidator();

// Parse configuration
const config = parser.parse(configText);

// Validate configuration
const result = validator.validate(config);

if (result.valid) {
  console.log('Configuration is valid!');
} else {
  console.error('Validation errors:', result.errors);
}
```

### Format Configuration

```typescript
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

const configText = parser.format(config);
console.log(configText);
```

### Validate Individual Fields

```typescript
// Validate specific fields
if (!validator.validatePrivateKey(key)) {
  throw new Error('Invalid private key');
}

if (!validator.validateEndpoint(endpoint)) {
  throw new Error('Invalid endpoint');
}
```

## API Reference

### ConfigParser

#### `parse(configText: string): WireGuardConfig`
Parse WireGuard INI format configuration.

**Parameters:**
- `configText`: INI format configuration string

**Returns:** Parsed configuration object

**Throws:** `ConfigParseError` if parsing fails

#### `format(config: WireGuardConfig): string`
Format configuration object to INI string.

**Parameters:**
- `config`: Configuration object

**Returns:** INI format string

#### `validate(config: WireGuardConfig): boolean`
Basic validation during parsing.

**Parameters:**
- `config`: Configuration to validate

**Returns:** `true` if valid

**Throws:** `ConfigParseError` if invalid

### ConfigValidator

#### `validate(config: WireGuardConfig): ValidationResult`
Comprehensive configuration validation.

**Parameters:**
- `config`: Configuration to validate

**Returns:** Validation result with errors if any

#### Field Validators

- `validatePrivateKey(key: string): boolean`
- `validatePublicKey(key: string): boolean`
- `validateAddress(address: string): boolean`
- `validateEndpoint(endpoint: string): boolean`
- `validateAllowedIPs(allowedIPs: string): boolean`
- `validateDNS(dns: string): boolean`
- `validateMTU(mtu: number): boolean`
- `validatePort(port: number): boolean`
- `validatePersistentKeepalive(keepalive: number): boolean`

## Data Types

### WireGuardConfig

```typescript
interface WireGuardConfig {
  interface: WireGuardInterface;
  peer: WireGuardPeer;
}
```

### WireGuardInterface

```typescript
interface WireGuardInterface {
  privateKey: string;      // Required
  address: string;         // Required
  dns?: string;            // Optional
  mtu?: number;            // Optional
  listenPort?: number;     // Optional
}
```

### WireGuardPeer

```typescript
interface WireGuardPeer {
  publicKey: string;            // Required
  endpoint: string;             // Required
  allowedIPs: string;           // Required
  persistentKeepalive?: number; // Optional
  presharedKey?: string;        // Optional
}
```

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  code: ValidationErrorCode;
}

enum ValidationErrorCode {
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_VALUE = 'INVALID_VALUE',
  INVALID_RANGE = 'INVALID_RANGE',
}
```

## Validation Rules

### WireGuard Keys
- Format: Base64 encoded
- Length: 44 characters (32 bytes + padding)
- Pattern: `[A-Za-z0-9+/]{43}=`

### IP Addresses
- Format: IPv4 with CIDR notation
- Pattern: `xxx.xxx.xxx.xxx/yy`
- Octets: 0-255
- Prefix: 0-32

### Endpoints
- Format: `hostname:port` or `ip:port`
- Port range: 1-65535

### DNS Servers
- Format: IPv4 address or comma-separated list
- Each server must be valid IPv4

### MTU
- Range: 1280-1500
- Must be integer

### Persistent Keepalive
- Range: 0-65535
- Must be integer
- 0 = disabled

## Examples

See the following files for detailed examples:
- `example-validator.ts` - ConfigValidator usage examples
- `integration-example.ts` - Parser + Validator integration

## Testing

```bash
npm test -- src/services/vpn/config/__tests__/ConfigParser.test.ts
npm test -- src/services/vpn/config/__tests__/ConfigValidator.test.ts
```

## Error Handling

### Parse Errors

```typescript
try {
  const config = parser.parse(configText);
} catch (error) {
  if (error instanceof ConfigParseError) {
    console.error(`Parse error at line ${error.line}: ${error.message}`);
  }
}
```

### Validation Errors

```typescript
const result = validator.validate(config);

if (!result.valid) {
  for (const error of result.errors) {
    console.error(`${error.field}: ${error.message} [${error.code}]`);
  }
}
```

## Best Practices

1. **Always validate after parsing**
   ```typescript
   const config = parser.parse(configText);
   const result = validator.validate(config);
   if (!result.valid) throw new Error('Invalid config');
   ```

2. **Validate before connecting**
   ```typescript
   const result = validator.validate(config);
   if (result.valid) {
     await connectVPN(config);
   }
   ```

3. **Use granular validators for user input**
   ```typescript
   if (!validator.validateEndpoint(userInput)) {
     showError('Invalid endpoint format');
   }
   ```

4. **Collect all errors for better UX**
   ```typescript
   const result = validator.validate(config);
   if (!result.valid) {
     showAllErrors(result.errors); // Show all issues at once
   }
   ```

## Integration

### With ConfigManager

```typescript
class ConfigManager {
  constructor(
    private parser: ConfigParser,
    private validator: ConfigValidator,
    private storage: ISecureStorage
  ) {}

  async saveConfig(configText: string): Promise<void> {
    const config = this.parser.parse(configText);
    const result = this.validator.validate(config);
    
    if (!result.valid) {
      throw new Error('Invalid configuration');
    }

    await this.storage.setItem('config', JSON.stringify(config));
  }
}
```

### With VPN Service

```typescript
class VPNService {
  async connect(configText: string): Promise<void> {
    const config = this.parser.parse(configText);
    const result = this.validator.validate(config);
    
    if (!result.valid) {
      throw new Error('Cannot connect: Invalid configuration');
    }

    await this.nativeModule.connect(this.parser.format(config));
  }
}
```

## License

Part of Shadow Shuttle VPN Integration
