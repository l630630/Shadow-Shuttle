/**
 * VPN Error Types
 * 
 * Defines all error types for VPN operations
 */

/**
 * Base VPN Error
 */
export class VPNError extends Error {
  public readonly code: string;
  public readonly recoverable: boolean;
  public readonly userMessage: string;

  constructor(
    message: string,
    code: string,
    userMessage: string,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'VPNError';
    this.code = code;
    this.userMessage = userMessage;
    this.recoverable = recoverable;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VPNError);
    }
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends VPNError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'NETWORK_ERROR',
      userMessage || '网络连接失败，请检查网络设置',
      true
    );
    this.name = 'NetworkError';
  }
}

/**
 * Authentication/Authorization errors
 */
export class AuthError extends VPNError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'AUTH_ERROR',
      userMessage || '认证失败，请检查预授权密钥',
      false
    );
    this.name = 'AuthError';
  }
}

/**
 * Configuration errors
 */
export class ConfigError extends VPNError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'CONFIG_ERROR',
      userMessage || '配置无效，请检查配置信息',
      false
    );
    this.name = 'ConfigError';
  }
}

/**
 * Connection errors
 */
export class ConnectionError extends VPNError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'CONNECTION_ERROR',
      userMessage || 'VPN 连接失败，请稍后重试',
      true
    );
    this.name = 'ConnectionError';
  }
}

/**
 * Permission errors
 */
export class PermissionError extends VPNError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'PERMISSION_ERROR',
      userMessage || '缺少 VPN 权限，请在设置中授权',
      false
    );
    this.name = 'PermissionError';
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends VPNError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'TIMEOUT_ERROR',
      userMessage || '操作超时，请检查网络连接',
      true
    );
    this.name = 'TimeoutError';
  }
}

/**
 * Storage errors
 */
export class StorageError extends VPNError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'STORAGE_ERROR',
      userMessage || '存储操作失败，请检查设备存储空间',
      true
    );
    this.name = 'StorageError';
  }
}

/**
 * Parse errors
 */
export class ParseError extends VPNError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'PARSE_ERROR',
      userMessage || '配置解析失败，请检查配置格式',
      false
    );
    this.name = 'ParseError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends VPNError {
  public readonly errors: string[];

  constructor(message: string, errors: string[], userMessage?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      userMessage || '配置验证失败，请检查配置信息',
      false
    );
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Error type guard functions
 */
export function isVPNError(error: unknown): error is VPNError {
  return error instanceof VPNError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isConfigError(error: unknown): error is ConfigError {
  return error instanceof ConfigError;
}

export function isConnectionError(error: unknown): error is ConnectionError {
  return error instanceof ConnectionError;
}

export function isPermissionError(error: unknown): error is PermissionError {
  return error instanceof PermissionError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError;
}

export function isParseError(error: unknown): error is ParseError {
  return error instanceof ParseError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Convert unknown error to VPNError
 */
export function toVPNError(error: unknown): VPNError {
  if (isVPNError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new VPNError(
      error.message,
      'UNKNOWN_ERROR',
      '发生未知错误，请稍后重试',
      true
    );
  }

  return new VPNError(
    String(error),
    'UNKNOWN_ERROR',
    '发生未知错误，请稍后重试',
    true
  );
}
