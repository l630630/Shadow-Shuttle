/**
 * Config Module Exports
 */

export { ConfigParser } from './ConfigParser';
export type {
  IConfigParser,
  WireGuardConfig,
  WireGuardInterface,
  WireGuardPeer,
} from '../interfaces/IConfigParser';
export { ConfigParseError } from '../interfaces/IConfigParser';

export { ConfigValidator } from './ConfigValidator';
export type {
  IConfigValidator,
  ValidationResult,
  ValidationError,
} from '../interfaces/IConfigValidator';
export { ValidationErrorCode } from '../interfaces/IConfigValidator';
