/**
 * 错误恢复策略模块 - Error Recovery Strategy Module
 * 
 * 提供自动重试、降级服务和错误日志记录功能
 * Provides auto-retry, service degradation, and error logging
 * 
 * 验证需求 / Validates Requirements: 14.7
 */

import { errorHandler, ErrorResponse } from './errorHandlers';

/**
 * 重试配置 / Retry Configuration
 */
export interface RetryConfig {
  /** 最大重试次数 / Maximum retry attempts */
  maxAttempts: number;
  /** 初始延迟（毫秒）/ Initial delay in milliseconds */
  initialDelay: number;
  /** 延迟倍数 / Delay multiplier */
  multiplier: number;
  /** 最大延迟（毫秒）/ Maximum delay in milliseconds */
  maxDelay: number;
  /** 是否使用指数退避 / Whether to use exponential backoff */
  useExponentialBackoff: boolean;
}

/**
 * 默认重试配置 / Default Retry Configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  multiplier: 2,
  maxDelay: 10000,
  useExponentialBackoff: true,
};

/**
 * 重试结果 / Retry Result
 */
export interface RetryResult<T> {
  /** 是否成功 / Whether successful */
  success: boolean;
  /** 结果数据 / Result data */
  data?: T;
  /** 错误信息 / Error information */
  error?: Error;
  /** 尝试次数 / Number of attempts */
  attempts: number;
  /** 总耗时（毫秒）/ Total time in milliseconds */
  totalTime: number;
}

/**
 * 错误恢复管理器 / Error Recovery Manager
 * 
 * 实现自动重试、降级服务和错误日志记录
 * Implements auto-retry, service degradation, and error logging
 * 
 * 验证需求 / Validates Requirements: 14.7
 */
export class ErrorRecoveryManager {
  private retryConfig: RetryConfig;
  private errorLog: Array<{
    timestamp: Date;
    error: Error;
    context: string;
    recovered: boolean;
  }> = [];

  constructor(config?: Partial<RetryConfig>) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * 执行带重试的操作 / Execute operation with retry
   * 
   * 自动重试失败的操作，使用指数退避策略
   * Automatically retries failed operations using exponential backoff
   * 
   * @param operation - 要执行的操作 / Operation to execute
   * @param context - 操作上下文 / Operation context
   * @param config - 自定义重试配置 / Custom retry configuration
   * @returns 重试结果 / Retry result
   * 
   * 验证需求 / Validates Requirements: 14.7
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    config?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.retryConfig, ...config };
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    for (let i = 0; i < finalConfig.maxAttempts; i++) {
      attempts++;

      try {
        const data = await operation();
        
        // 成功，记录恢复日志
        if (i > 0 && lastError) {
          this.logRecovery(context, lastError, true);
        }

        return {
          success: true,
          data,
          attempts,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error as Error;

        // 如果是最后一次尝试，不再重试
        if (i === finalConfig.maxAttempts - 1) {
          break;
        }

        // 计算延迟时间
        const delay = this.calculateDelay(i, finalConfig);

        // 等待后重试
        await this.sleep(delay);
      }
    }

    // 所有重试都失败，记录错误日志
    if (lastError) {
      this.logRecovery(context, lastError, false);
    }

    return {
      success: false,
      error: lastError,
      attempts,
      totalTime: Date.now() - startTime,
    };
  }

  /**
   * 计算重试延迟 / Calculate retry delay
   * 
   * @param attemptNumber - 尝试次数 / Attempt number
   * @param config - 重试配置 / Retry configuration
   * @returns 延迟时间（毫秒）/ Delay in milliseconds
   */
  private calculateDelay(attemptNumber: number, config: RetryConfig): number {
    if (!config.useExponentialBackoff) {
      return config.initialDelay;
    }

    // 指数退避：delay = initialDelay * (multiplier ^ attemptNumber)
    const delay = config.initialDelay * Math.pow(config.multiplier, attemptNumber);
    
    // 限制最大延迟
    return Math.min(delay, config.maxDelay);
  }

  /**
   * 睡眠指定时间 / Sleep for specified time
   * 
   * @param ms - 毫秒数 / Milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 记录恢复日志 / Log recovery
   * 
   * @param context - 上下文 / Context
   * @param error - 错误 / Error
   * @param recovered - 是否恢复 / Whether recovered
   */
  private logRecovery(context: string, error: Error, recovered: boolean): void {
    this.errorLog.push({
      timestamp: new Date(),
      error,
      context,
      recovered,
    });

    // 限制日志大小（最多保留 100 条）
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }
  }

  /**
   * 获取错误日志 / Get error log
   * 
   * @returns 错误日志列表 / Error log list
   */
  getErrorLog(): Array<{
    timestamp: Date;
    error: Error;
    context: string;
    recovered: boolean;
  }> {
    return [...this.errorLog];
  }

  /**
   * 清除错误日志 / Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * 获取错误统计 / Get error statistics
   * 
   * @returns 错误统计信息 / Error statistics
   */
  getErrorStatistics(): {
    total: number;
    recovered: number;
    failed: number;
    recoveryRate: number;
  } {
    const total = this.errorLog.length;
    const recovered = this.errorLog.filter(log => log.recovered).length;
    const failed = total - recovered;
    const recoveryRate = total > 0 ? recovered / total : 0;

    return {
      total,
      recovered,
      failed,
      recoveryRate,
    };
  }
}

/**
 * 降级服务管理器 / Service Degradation Manager
 * 
 * 管理服务降级策略，在服务不可用时提供降级功能
 * Manages service degradation strategies, providing fallback when services are unavailable
 * 
 * 验证需求 / Validates Requirements: 14.7
 */
export class ServiceDegradationManager {
  private serviceStatus: Map<string, boolean> = new Map();
  private degradationCallbacks: Map<string, () => void> = new Map();

  /**
   * 注册服务 / Register service
   * 
   * @param serviceName - 服务名称 / Service name
   * @param isAvailable - 是否可用 / Whether available
   */
  registerService(serviceName: string, isAvailable: boolean = true): void {
    this.serviceStatus.set(serviceName, isAvailable);
  }

  /**
   * 更新服务状态 / Update service status
   * 
   * @param serviceName - 服务名称 / Service name
   * @param isAvailable - 是否可用 / Whether available
   */
  updateServiceStatus(serviceName: string, isAvailable: boolean): void {
    const previousStatus = this.serviceStatus.get(serviceName);
    this.serviceStatus.set(serviceName, isAvailable);

    // 如果服务从可用变为不可用，触发降级回调
    if (previousStatus === true && isAvailable === false) {
      const callback = this.degradationCallbacks.get(serviceName);
      if (callback) {
        callback();
      }
    }
  }

  /**
   * 检查服务是否可用 / Check if service is available
   * 
   * @param serviceName - 服务名称 / Service name
   * @returns 是否可用 / Whether available
   */
  isServiceAvailable(serviceName: string): boolean {
    return this.serviceStatus.get(serviceName) ?? false;
  }

  /**
   * 注册降级回调 / Register degradation callback
   * 
   * @param serviceName - 服务名称 / Service name
   * @param callback - 降级回调函数 / Degradation callback
   */
  onServiceDegraded(serviceName: string, callback: () => void): void {
    this.degradationCallbacks.set(serviceName, callback);
  }

  /**
   * 获取所有服务状态 / Get all service statuses
   * 
   * @returns 服务状态映射 / Service status map
   */
  getAllServiceStatuses(): Map<string, boolean> {
    return new Map(this.serviceStatus);
  }

  /**
   * 获取不可用的服务列表 / Get unavailable services
   * 
   * @returns 不可用的服务名称列表 / List of unavailable service names
   */
  getUnavailableServices(): string[] {
    const unavailable: string[] = [];
    
    this.serviceStatus.forEach((isAvailable, serviceName) => {
      if (!isAvailable) {
        unavailable.push(serviceName);
      }
    });

    return unavailable;
  }
}

/**
 * 错误日志记录器 / Error Logger
 * 
 * 记录所有错误到审计日志
 * Logs all errors to audit log
 * 
 * 验证需求 / Validates Requirements: 14.7
 */
export class ErrorLogger {
  /**
   * 记录错误 / Log error
   * 
   * @param error - 错误对象 / Error object
   * @param context - 错误上下文 / Error context
   * @param errorResponse - 错误响应 / Error response
   */
  async logError(
    error: Error,
    context: {
      operation: string;
      userInput?: string;
      deviceId?: string;
      timestamp?: Date;
    },
    errorResponse?: ErrorResponse
  ): Promise<void> {
    const logEntry = {
      timestamp: context.timestamp || new Date(),
      operation: context.operation,
      errorType: errorResponse?.type || 'unknown',
      errorMessage: error.message,
      errorStack: error.stack,
      userInput: context.userInput,
      deviceId: context.deviceId,
      canRetry: errorResponse?.canRetry,
      action: errorResponse?.action,
      suggestions: errorResponse?.suggestions,
    };

    // 这里应该调用 AuditLogStore 记录日志
    // 为了避免循环依赖，这里只是示例
    console.error('[ErrorLogger]', JSON.stringify(logEntry, null, 2));

    // TODO: 集成 AuditLogStore
    // await auditLogStore.addLog({
    //   ...logEntry,
    //   riskLevel: this.determineRiskLevel(errorResponse),
    // });
  }

  /**
   * 确定风险级别 / Determine risk level
   * 
   * @param errorResponse - 错误响应 / Error response
   * @returns 风险级别 / Risk level
   */
  private determineRiskLevel(
    errorResponse?: ErrorResponse
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (!errorResponse) {
      return 'medium';
    }

    // 根据错误类型确定风险级别
    switch (errorResponse.type) {
      case 'permission_denied':
      case 'execution_error':
        return 'high';
      
      case 'storage_full':
      case 'invalid_key':
        return 'medium';
      
      case 'timeout':
      case 'network':
      case 'parsing_error':
        return 'low';
      
      default:
        return 'medium';
    }
  }
}

/**
 * 默认错误恢复管理器实例 / Default error recovery manager instance
 */
export const errorRecoveryManager = new ErrorRecoveryManager();

/**
 * 默认降级服务管理器实例 / Default service degradation manager instance
 */
export const serviceDegradationManager = new ServiceDegradationManager();

/**
 * 默认错误日志记录器实例 / Default error logger instance
 */
export const errorLogger = new ErrorLogger();

/**
 * 便捷函数：执行带错误处理和重试的操作
 * Convenience function: Execute operation with error handling and retry
 * 
 * @param operation - 要执行的操作 / Operation to execute
 * @param context - 操作上下文 / Operation context
 * @param options - 选项 / Options
 * @returns 操作结果 / Operation result
 */
export async function executeWithErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    name: string;
    userInput?: string;
    deviceId?: string;
    errorType?: 'network' | 'auth' | 'parsing' | 'execution' | 'storage' | 'permission';
  },
  options?: {
    retry?: boolean;
    retryConfig?: Partial<RetryConfig>;
    logError?: boolean;
  }
): Promise<T> {
  const shouldRetry = options?.retry ?? true;
  const shouldLog = options?.logError ?? true;

  try {
    if (shouldRetry) {
      // 使用重试机制
      const result = await errorRecoveryManager.executeWithRetry(
        operation,
        context.name,
        options?.retryConfig
      );

      if (result.success && result.data !== undefined) {
        return result.data;
      }

      // 重试失败，抛出错误
      throw result.error || new Error('Operation failed after retries');
    } else {
      // 不使用重试，直接执行
      return await operation();
    }
  } catch (error) {
    const err = error as Error;

    // 处理错误
    const errorResponse = errorHandler.handleError(err, {
      type: context.errorType,
      userInput: context.userInput,
    });

    // 记录错误日志
    if (shouldLog) {
      await errorLogger.logError(
        err,
        {
          operation: context.name,
          userInput: context.userInput,
          deviceId: context.deviceId,
        },
        errorResponse
      );
    }

    // 重新抛出错误，附带错误响应信息
    const enhancedError = new Error(errorResponse.message);
    (enhancedError as any).errorResponse = errorResponse;
    (enhancedError as any).originalError = err;
    
    throw enhancedError;
  }
}
