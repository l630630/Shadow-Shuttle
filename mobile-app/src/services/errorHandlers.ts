/**
 * 错误处理器模块 - Error Handlers Module
 * 
 * 提供统一的错误处理和用户反馈机制
 * Provides unified error handling and user feedback mechanisms
 * 
 * 验证需求 / Validates Requirements: 14.1, 14.2, 14.3, 14.5, 14.6
 */

/**
 * 错误类型 / Error Types
 */
export type ErrorType =
  | 'timeout'
  | 'network'
  | 'invalid_key'
  | 'quota_exceeded'
  | 'parsing_error'
  | 'command_not_found'
  | 'permission_denied'
  | 'execution_error'
  | 'storage_full'
  | 'storage_error'
  | 'unknown';

/**
 * 错误处理动作 / Error Actions
 */
export type ErrorAction =
  | 'retry'
  | 'offline_mode'
  | 'update_key'
  | 'upgrade_or_wait'
  | 'rephrase'
  | 'check_command'
  | 'add_sudo'
  | 'check_output'
  | 'clear_history'
  | 'request_permission'
  | 'contact_support';

/**
 * 错误响应接口 / Error Response Interface
 */
export interface ErrorResponse {
  /** 错误类型 / Error type */
  type: ErrorType;
  /** 错误消息 / Error message */
  message: string;
  /** 错误详情 / Error details */
  details?: string;
  /** 建议的处理动作 / Suggested action */
  action: ErrorAction;
  /** 是否可以重试 / Whether can retry */
  canRetry: boolean;
  /** 解决建议列表 / Solution suggestions */
  suggestions?: string[];
  /** 操作指引 / Operation instructions */
  instructions?: string[];
}

/**
 * 网络错误处理器 / Network Error Handler
 * 
 * 处理 AI 服务相关的网络错误
 * Handles network errors related to AI services
 * 
 * 验证需求 / Validates Requirements: 14.1
 */
export class NetworkErrorHandler {
  /**
   * 处理 AI 服务错误 / Handle AI service error
   * 
   * @param error - 错误对象 / Error object
   * @returns 错误响应 / Error response
   */
  handleAIServiceError(error: Error): ErrorResponse {
    const errorMessage = error.message.toLowerCase();

    // 超时错误 / Timeout error
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return {
        type: 'timeout',
        message: '连接超时，请检查网络连接',
        action: 'retry',
        canRetry: true,
        suggestions: [
          '检查网络连接是否正常',
          '尝试切换到更稳定的网络',
          '稍后再试',
        ],
      };
    }

    // 网络连接错误 / Network connection error
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('enotfound')
    ) {
      return {
        type: 'network',
        message: '网络连接失败，已切换到离线模式',
        action: 'offline_mode',
        canRetry: true,
        suggestions: [
          '检查网络连接',
          '在离线模式下可以使用历史记录和收藏',
          '网络恢复后会自动切换回在线模式',
        ],
      };
    }

    // 未知网络错误 / Unknown network error
    return {
      type: 'unknown',
      message: '未知网络错误',
      details: error.message,
      action: 'contact_support',
      canRetry: false,
    };
  }
}

/**
 * 认证错误处理器 / Authentication Error Handler
 * 
 * 处理 API 密钥相关的认证错误
 * Handles authentication errors related to API keys
 * 
 * 验证需求 / Validates Requirements: 14.1
 */
export class AuthErrorHandler {
  /**
   * 处理 API 密钥错误 / Handle API key error
   * 
   * @param error - 错误对象 / Error object
   * @returns 错误响应 / Error response
   */
  handleAPIKeyError(error: Error): ErrorResponse {
    const errorMessage = error.message.toLowerCase();

    // API 密钥无效 / Invalid API key
    if (
      errorMessage.includes('invalid_api_key') ||
      errorMessage.includes('invalid api key') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('401')
    ) {
      return {
        type: 'invalid_key',
        message: 'API 密钥无效，请检查并重新输入',
        action: 'update_key',
        canRetry: false,
        instructions: [
          '打开设置页面',
          '检查 API 密钥是否正确',
          '如需要，重新输入有效的 API 密钥',
        ],
      };
    }

    // 配额超限 / Quota exceeded
    if (
      errorMessage.includes('quota') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('429')
    ) {
      return {
        type: 'quota_exceeded',
        message: 'API 配额已用完，请升级账户或稍后再试',
        action: 'upgrade_or_wait',
        canRetry: true,
        suggestions: [
          '等待配额重置（通常每小时或每天）',
          '升级到更高级别的 API 账户',
          '使用其他 AI 服务提供商',
        ],
      };
    }

    // 通用认证错误 / Generic auth error
    return {
      type: 'invalid_key',
      message: '认证失败',
      details: error.message,
      action: 'update_key',
      canRetry: false,
    };
  }
}

/**
 * 解析错误处理器 / Parsing Error Handler
 * 
 * 处理 AI 解析相关的错误
 * Handles AI parsing related errors
 * 
 * 验证需求 / Validates Requirements: 14.1
 */
export class ParsingErrorHandler {
  /**
   * 处理解析错误 / Handle parsing error
   * 
   * @param error - 错误对象 / Error object
   * @param userInput - 用户输入 / User input
   * @returns 错误响应 / Error response
   */
  handleParsingError(error: Error, userInput: string): ErrorResponse {
    return {
      type: 'parsing_error',
      message: 'AI 无法理解您的输入，请尝试更详细的描述',
      details: error.message,
      action: 'rephrase',
      canRetry: true,
      suggestions: [
        '尝试使用更具体的动词（如"列出"、"删除"、"创建"）',
        '提供更多上下文信息（如文件路径、目标位置）',
        '使用简单的句子结构',
        '参考历史记录中的成功示例',
      ],
    };
  }
}

/**
 * 执行错误处理器 / Execution Error Handler
 * 
 * 处理命令执行相关的错误
 * Handles command execution related errors
 * 
 * 验证需求 / Validates Requirements: 14.2, 14.3
 */
export class ExecutionErrorHandler {
  /**
   * 处理命令执行错误 / Handle command execution error
   * 
   * @param exitCode - 退出状态码 / Exit code
   * @param stderr - 错误输出 / Error output
   * @returns 错误响应 / Error response
   * 
   * 验证需求 / Validates Requirements: 14.2
   */
  handleCommandError(exitCode: number, stderr: string): ErrorResponse {
    // 命令不存在 / Command not found
    if (exitCode === 127) {
      return {
        type: 'command_not_found',
        message: '命令不存在',
        details: stderr,
        action: 'check_command',
        canRetry: false,
        suggestions: [
          '检查命令拼写是否正确',
          '确认命令在目标系统上已安装',
          '尝试使用完整路径',
        ],
      };
    }

    // 权限不足 / Permission denied
    if (exitCode === 126 || stderr.toLowerCase().includes('permission denied')) {
      return {
        type: 'permission_denied',
        message: '权限不足，可能需要 sudo',
        details: stderr,
        action: 'add_sudo',
        canRetry: true,
        suggestions: [
          '尝试在命令前添加 sudo',
          '检查文件或目录的权限',
          '确认当前用户有执行权限',
        ],
      };
    }

    // 通用执行错误 / Generic execution error
    return {
      type: 'execution_error',
      message: `命令执行失败 (退出码: ${exitCode})`,
      details: stderr,
      action: 'check_output',
      canRetry: true,
      suggestions: [
        '查看错误输出了解详细信息',
        '检查命令参数是否正确',
        '确认目标文件或目录存在',
      ],
    };
  }

  /**
   * 处理 SSH 连接错误 / Handle SSH connection error
   * 
   * @param error - 错误对象 / Error object
   * @returns 错误响应 / Error response
   * 
   * 验证需求 / Validates Requirements: 14.3
   */
  handleSSHError(error: Error): ErrorResponse {
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('connection refused')) {
      return {
        type: 'network',
        message: 'SSH 连接被拒绝',
        details: error.message,
        action: 'retry',
        canRetry: true,
        suggestions: [
          '检查目标设备是否在线',
          '确认 SSH 服务正在运行',
          '检查防火墙设置',
        ],
      };
    }

    if (errorMessage.includes('timeout')) {
      return {
        type: 'timeout',
        message: 'SSH 连接超时',
        details: error.message,
        action: 'retry',
        canRetry: true,
        suggestions: [
          '检查网络连接',
          '确认目标设备可达',
          '尝试增加超时时间',
        ],
      };
    }

    return {
      type: 'execution_error',
      message: 'SSH 连接失败',
      details: error.message,
      action: 'retry',
      canRetry: true,
    };
  }
}

/**
 * 存储错误处理器 / Storage Error Handler
 * 
 * 处理本地存储相关的错误
 * Handles local storage related errors
 * 
 * 验证需求 / Validates Requirements: 14.5
 */
export class StorageErrorHandler {
  /**
   * 处理存储错误 / Handle storage error
   * 
   * @param error - 错误对象 / Error object
   * @returns 错误响应 / Error response
   */
  handleStorageError(error: Error): ErrorResponse {
    const errorMessage = error.message.toLowerCase();

    // 存储空间不足 / Storage full
    if (
      errorMessage.includes('quota') ||
      errorMessage.includes('full') ||
      errorMessage.includes('no space')
    ) {
      return {
        type: 'storage_full',
        message: '存储空间不足，请清理历史记录',
        details: error.message,
        action: 'clear_history',
        canRetry: false,
        instructions: [
          '打开历史记录页面',
          '删除不需要的历史记录',
          '或清空所有历史记录',
        ],
      };
    }

    // 通用存储错误 / Generic storage error
    return {
      type: 'storage_error',
      message: '数据保存失败',
      details: error.message,
      action: 'retry',
      canRetry: true,
      suggestions: [
        '稍后重试',
        '检查应用权限',
        '重启应用',
      ],
    };
  }
}

/**
 * 权限错误处理器 / Permission Error Handler
 * 
 * 处理应用权限相关的错误
 * Handles app permission related errors
 * 
 * 验证需求 / Validates Requirements: 14.6
 */
export class PermissionErrorHandler {
  /**
   * 处理麦克风权限错误 / Handle microphone permission error
   * 
   * @returns 错误响应 / Error response
   */
  handleMicrophonePermission(): ErrorResponse {
    return {
      type: 'permission_denied',
      message: '需要麦克风权限才能使用语音输入',
      action: 'request_permission',
      canRetry: true,
      instructions: [
        '打开系统设置',
        '找到影梭应用',
        '启用麦克风权限',
        '返回应用重试',
      ],
    };
  }

  /**
   * 处理存储权限错误 / Handle storage permission error
   * 
   * @returns 错误响应 / Error response
   */
  handleStoragePermission(): ErrorResponse {
    return {
      type: 'permission_denied',
      message: '需要存储权限才能保存数据',
      action: 'request_permission',
      canRetry: true,
      instructions: [
        '打开系统设置',
        '找到影梭应用',
        '启用存储权限',
        '返回应用重试',
      ],
    };
  }
}

/**
 * 统一错误处理器 / Unified Error Handler
 * 
 * 提供统一的错误处理入口
 * Provides unified error handling entry point
 */
export class ErrorHandler {
  private networkHandler = new NetworkErrorHandler();
  private authHandler = new AuthErrorHandler();
  private parsingHandler = new ParsingErrorHandler();
  private executionHandler = new ExecutionErrorHandler();
  private storageHandler = new StorageErrorHandler();
  private permissionHandler = new PermissionErrorHandler();

  /**
   * 处理错误 / Handle error
   * 
   * 根据错误类型自动选择合适的处理器
   * Automatically selects appropriate handler based on error type
   * 
   * @param error - 错误对象 / Error object
   * @param context - 错误上下文 / Error context
   * @returns 错误响应 / Error response
   */
  handleError(
    error: Error,
    context?: {
      type?: 'network' | 'auth' | 'parsing' | 'execution' | 'storage' | 'permission';
      userInput?: string;
      exitCode?: number;
      stderr?: string;
    }
  ): ErrorResponse {
    if (!context) {
      return this.handleUnknownError(error);
    }

    switch (context.type) {
      case 'network':
        return this.networkHandler.handleAIServiceError(error);
      
      case 'auth':
        return this.authHandler.handleAPIKeyError(error);
      
      case 'parsing':
        return this.parsingHandler.handleParsingError(
          error,
          context.userInput || ''
        );
      
      case 'execution':
        if (context.exitCode !== undefined && context.stderr !== undefined) {
          return this.executionHandler.handleCommandError(
            context.exitCode,
            context.stderr
          );
        }
        return this.executionHandler.handleSSHError(error);
      
      case 'storage':
        return this.storageHandler.handleStorageError(error);
      
      case 'permission':
        return this.permissionHandler.handleMicrophonePermission();
      
      default:
        return this.handleUnknownError(error);
    }
  }

  /**
   * 处理未知错误 / Handle unknown error
   * 
   * @param error - 错误对象 / Error object
   * @returns 错误响应 / Error response
   */
  private handleUnknownError(error: Error): ErrorResponse {
    return {
      type: 'unknown',
      message: '发生未知错误',
      details: error.message,
      action: 'contact_support',
      canRetry: false,
      suggestions: [
        '尝试重启应用',
        '检查应用更新',
        '联系技术支持',
      ],
    };
  }

  /**
   * 获取网络错误处理器 / Get network error handler
   */
  get network() {
    return this.networkHandler;
  }

  /**
   * 获取认证错误处理器 / Get auth error handler
   */
  get auth() {
    return this.authHandler;
  }

  /**
   * 获取解析错误处理器 / Get parsing error handler
   */
  get parsing() {
    return this.parsingHandler;
  }

  /**
   * 获取执行错误处理器 / Get execution error handler
   */
  get execution() {
    return this.executionHandler;
  }

  /**
   * 获取存储错误处理器 / Get storage error handler
   */
  get storage() {
    return this.storageHandler;
  }

  /**
   * 获取权限错误处理器 / Get permission error handler
   */
  get permission() {
    return this.permissionHandler;
  }
}

/**
 * 默认错误处理器实例 / Default error handler instance
 */
export const errorHandler = new ErrorHandler();
