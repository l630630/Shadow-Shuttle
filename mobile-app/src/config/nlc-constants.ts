/**
 * Natural Language Control Constants
 * 自然语言控制常量配置
 */

// ============================================================================
// Storage Keys
// ============================================================================

export const StorageKeys = {
  // API 密钥（使用 SecureStore）
  API_KEY_PREFIX: 'api_key_',
  
  // 命令历史
  COMMAND_HISTORY: 'command_history',
  
  // 命令收藏
  COMMAND_FAVORITES: 'command_favorites',
  
  // 审计日志
  AUDIT_LOGS: 'audit_logs',
  
  // 应用设置
  APP_SETTINGS: 'app_settings',
  
  // 对话历史
  CONVERSATIONS: 'conversations',
  
  // 危险命令模式
  DANGEROUS_PATTERNS: 'dangerous_patterns',
} as const;

// ============================================================================
// Default Settings
// ============================================================================

export const DEFAULT_SETTINGS = {
  // AI 设置
  aiProvider: 'openai' as const,
  aiTimeout: 5000, // 5 seconds
  aiMaxTokens: 500,
  
  // 隐私设置
  privacyFilterEnabled: true,
  
  // 安全设置
  dangerousCommandWarning: true,
  requireConfirmation: true,
  
  // 语音设置
  voiceInputEnabled: true,
  voiceLanguage: 'auto' as const,
  
  // 界面设置
  language: 'zh' as const,
  theme: 'auto' as const,
  
  // 历史设置
  maxHistoryEntries: 1000,
  historyRetentionDays: 90,
  
  // 审计设置
  auditLogEnabled: true,
  auditLogRetentionDays: 30,
  
  // 离线模式
  offlineMode: false,
};

// ============================================================================
// Dangerous Command Patterns
// ============================================================================

export const DEFAULT_DANGEROUS_PATTERNS = [
  {
    id: 'rm-rf',
    pattern: /rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|--recursive\s+--force|-rf|-fr)\s+/,
    description: '递归强制删除文件或目录',
    riskLevel: 'critical' as const,
    examples: ['rm -rf /', 'rm -rf *', 'rm -fr /home'],
  },
  {
    id: 'dd',
    pattern: /dd\s+if=/,
    description: '磁盘数据复制，可能覆盖数据',
    riskLevel: 'critical' as const,
    examples: ['dd if=/dev/zero of=/dev/sda', 'dd if=/dev/urandom of=/dev/sdb'],
  },
  {
    id: 'mkfs',
    pattern: /mkfs\./,
    description: '格式化文件系统，会删除所有数据',
    riskLevel: 'critical' as const,
    examples: ['mkfs.ext4 /dev/sda1', 'mkfs.ntfs /dev/sdb1'],
  },
  {
    id: 'fdisk',
    pattern: /fdisk\s+/,
    description: '磁盘分区工具，可能导致数据丢失',
    riskLevel: 'high' as const,
    examples: ['fdisk /dev/sda', 'fdisk -l'],
  },
  {
    id: 'format',
    pattern: /format\s+[a-zA-Z]:/i,
    description: 'Windows 格式化命令',
    riskLevel: 'critical' as const,
    examples: ['format C:', 'format D: /fs:ntfs'],
  },
  {
    id: 'sudo',
    pattern: /sudo\s+/,
    description: '提升权限执行命令',
    riskLevel: 'medium' as const,
    examples: ['sudo rm -rf /', 'sudo apt-get install'],
  },
  {
    id: 'chmod-777',
    pattern: /chmod\s+(-R\s+)?777/,
    description: '设置文件权限为完全开放',
    riskLevel: 'medium' as const,
    examples: ['chmod 777 file.txt', 'chmod -R 777 /var/www'],
  },
  {
    id: 'chown-root',
    pattern: /chown\s+(-R\s+)?root/,
    description: '更改文件所有者为 root',
    riskLevel: 'medium' as const,
    examples: ['chown root file.txt', 'chown -R root:root /etc'],
  },
];

// ============================================================================
// Privacy Filter Patterns
// ============================================================================

export const PRIVACY_PATTERNS = {
  // 文件路径模式
  FILE_PATH: /(?:\/[a-zA-Z0-9_\-\.]+)+|(?:[a-zA-Z]:\\(?:[a-zA-Z0-9_\-\.\\]+)+)/g,
  
  // IP 地址模式
  IP_ADDRESS: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  
  // 密码模式（password=xxx, pwd=xxx, pass=xxx）
  PASSWORD: /(?:password|pwd|pass|passwd|secret)\s*[=:]\s*['"]?([^\s'"]+)['"]?/gi,
  
  // API 密钥模式
  API_KEY: /(?:api[_-]?key|apikey|access[_-]?token)\s*[=:]\s*['"]?([a-zA-Z0-9_\-]+)['"]?/gi,
  
  // 邮箱地址模式
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
};

// ============================================================================
// AI Service Configuration
// ============================================================================

export const AI_SERVICE_CONFIG = {
  openai: {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4',
    maxTokens: 500,
    temperature: 0.3,
  },
  claude: {
    apiUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 500,
    temperature: 0.3,
  },
  gemini: {
    // 默认使用官方 API，可以通过环境变量或配置覆盖
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    // 自定义 API 端点（如果使用第三方代理）
    customApiUrl: 'https://api2.qiandao.mom/v1',
    model: 'gemini-pro',
    // 推荐的模型（用于第三方 API）
    recommendedModels: [
      'gemini-3-pro-preview-h',
      'gemini-3-pro-preview-u',
      'gemini-2.5-pro-preview-p',
    ],
    maxTokens: 500,
    temperature: 0.3,
  },
  siliconflow: {
    apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    model: 'Qwen/Qwen3-VL-32B-Instruct',
    // 推荐的模型
    recommendedModels: [
      'Qwen/Qwen3-VL-32B-Instruct',    // 通义千问 3 VL (32B) - 视觉语言模型，性能强
      'Qwen/Qwen2.5-7B-Instruct',      // 通义千问 2.5 (7B) - 快速且便宜
      'Qwen/Qwen2.5-14B-Instruct',     // 通义千问 2.5 (14B) - 平衡性能
      'Qwen/Qwen2.5-32B-Instruct',     // 通义千问 2.5 (32B) - 高性能
      'deepseek-ai/DeepSeek-V2.5',     // DeepSeek V2.5 - 代码能力强
      'Pro/Qwen/Qwen2.5-72B-Instruct', // 通义千问 2.5 (72B) - 最强性能
    ],
    maxTokens: 2048,
    temperature: 0.7,
  },
};

// ============================================================================
// Performance Thresholds
// ============================================================================

export const PERFORMANCE_THRESHOLDS = {
  AI_RESPONSE_TIME: 3000, // 3 seconds
  VOICE_RECOGNITION_TIME: 1000, // 1 second
  SUGGESTION_RESPONSE_TIME: 500, // 500 milliseconds
  HISTORY_LOAD_TIME: 200, // 200 milliseconds
  PRIVACY_FILTER_TIME: 50, // 50 milliseconds
};

// ============================================================================
// UI Constants
// ============================================================================

export const UI_CONSTANTS = {
  MAX_SUGGESTIONS: 5,
  MAX_CONVERSATION_MESSAGES: 50,
  DEBOUNCE_DELAY: 300, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
};

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  zh: {
    NETWORK_ERROR: '网络连接失败，请检查网络设置',
    TIMEOUT_ERROR: '请求超时，请稍后重试',
    INVALID_API_KEY: 'API 密钥无效，请检查并重新输入',
    QUOTA_EXCEEDED: 'API 配额已用完，请升级账户或稍后再试',
    PARSING_ERROR: 'AI 无法理解您的输入，请尝试更详细的描述',
    COMMAND_NOT_FOUND: '命令不存在',
    PERMISSION_DENIED: '权限不足，可能需要 sudo',
    EXECUTION_ERROR: '命令执行失败',
    STORAGE_ERROR: '数据保存失败',
    VOICE_PERMISSION_DENIED: '需要麦克风权限才能使用语音输入',
  },
  en: {
    NETWORK_ERROR: 'Network connection failed, please check your network settings',
    TIMEOUT_ERROR: 'Request timeout, please try again later',
    INVALID_API_KEY: 'Invalid API key, please check and re-enter',
    QUOTA_EXCEEDED: 'API quota exceeded, please upgrade your account or try later',
    PARSING_ERROR: 'AI cannot understand your input, please try a more detailed description',
    COMMAND_NOT_FOUND: 'Command not found',
    PERMISSION_DENIED: 'Permission denied, may need sudo',
    EXECUTION_ERROR: 'Command execution failed',
    STORAGE_ERROR: 'Data save failed',
    VOICE_PERMISSION_DENIED: 'Microphone permission required for voice input',
  },
};
