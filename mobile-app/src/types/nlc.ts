/**
 * Natural Language Control Type Definitions
 * 自然语言控制类型定义
 */

// ============================================================================
// AI Service Types
// ============================================================================

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'siliconflow';

export interface AIRequestOptions {
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  conversationHistory?: Message[];
}

export interface AIResponse {
  command: string;
  explanation: string;
  confidence: number;
  rawResponse: string;
}

export interface ServiceStatus {
  available: boolean;
  latency?: number;
  error?: string;
}

// ============================================================================
// Command Context Types
// ============================================================================

export interface CommandContext {
  currentDirectory: string;
  deviceInfo: DeviceInfo;
  recentCommands: string[];
  conversationHistory: Message[];
}

export interface DeviceInfo {
  id: string;
  name: string;
  os: 'linux' | 'macos' | 'windows';
  shell: 'bash' | 'zsh' | 'sh' | 'powershell';
  currentDirectory: string;
  username: string;
  hostname: string;
}

// ============================================================================
// Parse and Execution Result Types
// ============================================================================

export interface ParseResult {
  success: boolean;
  command?: string;
  explanation?: string;
  confidence: number;
  isDangerous: boolean;
  requiresConfirmation?: boolean; // ✨ 新增：是否需要用户确认
  riskLevel?: RiskLevel; // ✨ 新增：风险级别
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  exitCode: number;
  executionTime: number;
  error?: string;
}

// ============================================================================
// Privacy Filter Types
// ============================================================================

export type SensitiveType = 'file_path' | 'ip_address' | 'password' | 'api_key' | 'email';

export interface SanitizedText {
  sanitized: string;
  mapping: SensitiveMapping;
  detectedTypes: SensitiveType[];
}

export interface SensitiveMapping {
  [placeholder: string]: string;
}

export interface SensitiveInfo {
  type: SensitiveType;
  value: string;
  startIndex: number;
  endIndex: number;
}

// ============================================================================
// Security Checker Types
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityCheckResult {
  isDangerous: boolean;
  riskLevel: RiskLevel;
  matchedPatterns: DangerousPattern[];
  warnings: string[];
  requiresConfirmation: boolean;
}

export interface DangerousPattern {
  id: string;
  pattern: RegExp;
  description: string;
  riskLevel: RiskLevel;
  examples: string[];
}

// ============================================================================
// Voice Input Types
// ============================================================================

export interface VoiceRecognitionResult {
  success: boolean;
  text?: string;
  confidence: number;
  language: 'zh' | 'en';
  duration: number;
  error?: string;
}

export interface RecordingStatus {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
}

// ============================================================================
// Command Suggestion Types
// ============================================================================

export type SuggestionSource = 'history' | 'favorite' | 'context';

export interface Suggestion {
  command: string;
  description: string;
  score: number;
  source: SuggestionSource;
  lastUsed?: Date;
  usageCount: number;
}

// ============================================================================
// Command History Types
// ============================================================================

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  deviceId: string;
  deviceName: string;
  userInput: string;
  parsedCommand: string;
  output: string;
  exitCode: number;
  executionTime: number;
  isDangerous: boolean;
}

export interface HistoryFilter {
  deviceId?: string;
  startDate?: Date;
  endDate?: Date;
  isDangerous?: boolean;
}

// ============================================================================
// Command Favorite Types
// ============================================================================

export interface FavoriteEntry {
  id: string;
  name: string;
  description: string;
  command: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  tags: string[];
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  deviceId: string;
  userInput: string;
  aiParsedCommand: string;
  executedCommand: string;
  output: string;
  exitCode: number;
  riskLevel: RiskLevel;
  wasConfirmed: boolean;
  executionTime: number;
}

export interface AuditLogFilter {
  deviceId?: string;
  startDate?: Date;
  endDate?: Date;
  riskLevel?: RiskLevel;
}

// ============================================================================
// Message and Conversation Types
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  type?: 'text' | 'command' | 'warning';
  image?: string;
}

export interface MessageMetadata {
  command?: string;
  executionResult?: ExecutionResult;
  isConfirmed?: boolean;
  isDangerous?: boolean;
  requiresConfirmation?: boolean; // ✨ 新增
  riskLevel?: RiskLevel; // ✨ 新增
  context?: CommandContext;
}

export interface Conversation {
  id: string;
  deviceId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  context: CommandContext;
}

// ============================================================================
// Settings Types
// ============================================================================

export interface AppSettings {
  // AI 设置
  aiProvider: AIProvider;
  aiTimeout: number;
  aiMaxTokens: number;
  
  // 隐私设置
  privacyFilterEnabled: boolean;
  
  // 安全设置
  dangerousCommandWarning: boolean;
  requireConfirmation: boolean;
  customDangerousPatterns: DangerousPattern[];
  
  // 语音设置
  voiceInputEnabled: boolean;
  voiceLanguage: 'zh' | 'en' | 'auto';
  
  // 界面设置
  language: 'zh' | 'en';
  theme: 'light' | 'dark' | 'auto';
  
  // 历史设置
  maxHistoryEntries: number;
  historyRetentionDays: number;
  
  // 审计设置
  auditLogEnabled: boolean;
  auditLogRetentionDays: number;
  
  // 离线模式
  offlineMode: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

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

export interface ErrorResponse {
  type: ErrorType;
  message: string;
  details?: string;
  action: ErrorAction;
  canRetry: boolean;
  suggestions?: string[];
  instructions?: string[];
}
