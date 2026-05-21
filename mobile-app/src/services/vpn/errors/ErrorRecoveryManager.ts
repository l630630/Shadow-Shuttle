/**
 * Error Recovery Manager
 * 
 * Handles error recovery strategies and user notifications
 */

import {
  VPNError,
  NetworkError,
  AuthError,
  ConfigError,
  ConnectionError,
  PermissionError,
  TimeoutError,
  StorageError,
  ParseError,
  ValidationError,
  isVPNError,
  toVPNError,
} from './VPNErrors';

/**
 * Recovery action types
 */
export type RecoveryAction =
  | 'retry'
  | 'reconnect'
  | 'reconfigure'
  | 'request_permission'
  | 'clear_storage'
  | 'contact_support'
  | 'none';

/**
 * Recovery strategy
 */
export interface RecoveryStrategy {
  action: RecoveryAction;
  message: string;
  autoRetry: boolean;
  retryDelay?: number;
}

/**
 * User notification
 */
export interface UserNotification {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * Error Recovery Manager
 */
export class ErrorRecoveryManager {
  /**
   * Get recovery strategy for error
   */
  public getRecoveryStrategy(error: unknown): RecoveryStrategy {
    const vpnError = isVPNError(error) ? error : toVPNError(error);

    // Network errors - retry with delay
    if (vpnError instanceof NetworkError) {
      return {
        action: 'retry',
        message: '网络连接失败，将在 5 秒后自动重试',
        autoRetry: true,
        retryDelay: 5000,
      };
    }

    // Auth errors - need reconfiguration
    if (vpnError instanceof AuthError) {
      return {
        action: 'reconfigure',
        message: '认证失败，请重新配置 VPN',
        autoRetry: false,
      };
    }

    // Config errors - need reconfiguration
    if (vpnError instanceof ConfigError) {
      return {
        action: 'reconfigure',
        message: '配置无效，请重新配置 VPN',
        autoRetry: false,
      };
    }

    // Connection errors - retry with reconnect
    if (vpnError instanceof ConnectionError) {
      return {
        action: 'reconnect',
        message: 'VPN 连接失败，将在 3 秒后自动重连',
        autoRetry: true,
        retryDelay: 3000,
      };
    }

    // Permission errors - need user action
    if (vpnError instanceof PermissionError) {
      return {
        action: 'request_permission',
        message: '缺少 VPN 权限，请在设置中授权',
        autoRetry: false,
      };
    }

    // Timeout errors - retry immediately
    if (vpnError instanceof TimeoutError) {
      return {
        action: 'retry',
        message: '操作超时，将立即重试',
        autoRetry: true,
        retryDelay: 1000,
      };
    }

    // Storage errors - clear and retry
    if (vpnError instanceof StorageError) {
      return {
        action: 'clear_storage',
        message: '存储操作失败，请清除缓存后重试',
        autoRetry: false,
      };
    }

    // Parse errors - need reconfiguration
    if (vpnError instanceof ParseError) {
      return {
        action: 'reconfigure',
        message: '配置解析失败，请重新配置 VPN',
        autoRetry: false,
      };
    }

    // Validation errors - need reconfiguration
    if (vpnError instanceof ValidationError) {
      return {
        action: 'reconfigure',
        message: '配置验证失败，请检查配置信息',
        autoRetry: false,
      };
    }

    // Unknown errors - contact support
    return {
      action: 'contact_support',
      message: '发生未知错误，请联系技术支持',
      autoRetry: false,
    };
  }

  /**
   * Generate user notification for error
   */
  public generateNotification(
    error: unknown,
    onAction?: (action: RecoveryAction) => void
  ): UserNotification {
    const vpnError = isVPNError(error) ? error : toVPNError(error);
    const strategy = this.getRecoveryStrategy(vpnError);

    // Determine severity
    let severity: 'error' | 'warning' | 'info' = 'error';
    if (strategy.autoRetry) {
      severity = 'warning';
    }

    // Generate notification
    const notification: UserNotification = {
      title: this.getErrorTitle(vpnError),
      message: vpnError.userMessage,
      severity,
    };

    // Add action button if needed
    if (onAction && strategy.action !== 'none') {
      notification.action = {
        label: this.getActionLabel(strategy.action),
        handler: () => onAction(strategy.action),
      };
    }

    return notification;
  }

  /**
   * Get error title
   */
  private getErrorTitle(error: VPNError): string {
    if (error instanceof NetworkError) {
      return '网络错误';
    }
    if (error instanceof AuthError) {
      return '认证失败';
    }
    if (error instanceof ConfigError) {
      return '配置错误';
    }
    if (error instanceof ConnectionError) {
      return '连接失败';
    }
    if (error instanceof PermissionError) {
      return '权限不足';
    }
    if (error instanceof TimeoutError) {
      return '操作超时';
    }
    if (error instanceof StorageError) {
      return '存储错误';
    }
    if (error instanceof ParseError) {
      return '解析错误';
    }
    if (error instanceof ValidationError) {
      return '验证失败';
    }
    return 'VPN 错误';
  }

  /**
   * Get action label
   */
  private getActionLabel(action: RecoveryAction): string {
    switch (action) {
      case 'retry':
        return '重试';
      case 'reconnect':
        return '重新连接';
      case 'reconfigure':
        return '重新配置';
      case 'request_permission':
        return '授权';
      case 'clear_storage':
        return '清除缓存';
      case 'contact_support':
        return '联系支持';
      default:
        return '确定';
    }
  }

  /**
   * Check if error is recoverable
   */
  public isRecoverable(error: unknown): boolean {
    const vpnError = isVPNError(error) ? error : toVPNError(error);
    return vpnError.recoverable;
  }

  /**
   * Get retry delay for error
   */
  public getRetryDelay(error: unknown): number | null {
    const strategy = this.getRecoveryStrategy(error);
    return strategy.autoRetry ? (strategy.retryDelay || 0) : null;
  }

  /**
   * Format error for logging
   */
  public formatErrorForLogging(error: unknown): string {
    const vpnError = isVPNError(error) ? error : toVPNError(error);
    
    let formatted = `[${vpnError.code}] ${vpnError.message}`;
    
    if (vpnError instanceof ValidationError && vpnError.errors.length > 0) {
      formatted += `\nValidation errors:\n${vpnError.errors.map(e => `  - ${e}`).join('\n')}`;
    }
    
    if (vpnError.stack) {
      formatted += `\nStack trace:\n${vpnError.stack}`;
    }
    
    return formatted;
  }

  /**
   * Format error for user display
   */
  public formatErrorForUser(error: unknown): string {
    const vpnError = isVPNError(error) ? error : toVPNError(error);
    return vpnError.userMessage;
  }
}
