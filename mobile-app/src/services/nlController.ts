/**
 * Natural Language Controller
 * 自然语言控制器
 * 
 * Orchestrates the entire natural language command parsing and execution flow.
 * Integrates PrivacyFilter, AIService, SecurityChecker, and SSHService.
 * 
 * 协调整个自然语言命令解析和执行流程。
 * 集成隐私过滤器、AI 服务、安全检查器和 SSH 服务。
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7
 */

import { AIService } from './aiService';
import { AIProviderFactory } from './ai/AIProviderFactory';
import { PrivacyFilter } from './privacyFilter';
import { SecurityChecker } from './securityChecker';
import { SSHService, getSSHService } from './sshService';
import { apiKeyStore } from '../stores/apiKeyStore';
import {
  CommandContext,
  ParseResult,
  ExecutionResult,
  AIProvider,
  AIRequestOptions,
  RemoteContext,
} from '../types/nlc';

/**
 * NLController Interface
 * 自然语言控制器接口
 */
export interface INLController {
  /**
   * Parse natural language input into a shell command
   * 将自然语言输入解析为 Shell 命令
   * 
   * @param input User's natural language input
   * @param context Command context (device info, current directory, etc.)
   * @returns Parse result with command and metadata
   */
  parseNaturalLanguage(
    input: string,
    context: CommandContext
  ): Promise<ParseResult>;

  /**
   * Execute a command via SSH
   * 通过 SSH 执行命令
   * 
   * @param command Command to execute
   * @param deviceId Target device ID
   * @param sessionId SSH session ID
   * @returns Execution result
   */
  executeCommand(
    command: string,
    deviceId: string,
    sessionId: string
  ): Promise<ExecutionResult>;

  /**
   * Cancel ongoing parsing request
   * 取消正在进行的解析请求
   */
  cancelParsing(): void;

  /**
   * Set the AI provider to use
   * 设置要使用的 AI 提供商
   * 
   * @param provider AI provider (openai, claude, gemini)
   */
  setAIProvider(provider: AIProvider): Promise<void>;

  /**
   * Get current AI provider
   * 获取当前 AI 提供商
   * 
   * @returns Current AI provider or null if not set
   */
  getCurrentProvider(): AIProvider | null;
}

/**
 * NLController Implementation
 * 自然语言控制器实现
 */
export class NLController implements INLController {
  private aiService: AIService | null = null;
  private privacyFilter: PrivacyFilter;
  private securityChecker: SecurityChecker;
  private sshService: SSHService;
  private currentProvider: AIProvider | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    this.privacyFilter = new PrivacyFilter();
    this.securityChecker = new SecurityChecker();
    this.sshService = getSSHService();
  }

  /**
   * Set the AI provider to use
   * 设置要使用的 AI 提供商
   * 
   * Loads the API key from secure storage and initializes the appropriate AI service.
   * 从安全存储加载 API 密钥并初始化相应的 AI 服务。
   * 
   * @param provider AI provider (openai, claude, gemini)
   * @throws Error if API key is not found or invalid
   */
  async setAIProvider(provider: AIProvider): Promise<void> {
    // Get API key from secure storage
    const apiKey = await apiKeyStore.getAPIKey(provider);

    if (!apiKey) {
      throw new Error(
        `No API key found for ${provider}. Please configure your API key in settings.`
      );
    }

    // Initialize the appropriate AI service
    switch (provider) {
      case 'openai':
      case 'claude':
      case 'gemini':
      case 'siliconflow':
        this.aiService = AIProviderFactory.create(provider, apiKey);
        break;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }

    this.currentProvider = provider;
  }

  /**
   * Get current AI provider
   * 获取当前 AI 提供商
   * 
   * @returns Current AI provider or null if not set
   */
  getCurrentProvider(): AIProvider | null {
    return this.currentProvider;
  }

  /**
   * 获取当前 AI 服务实例（供 AgentExecutor 使用）
   * 获取当前 AI 服务实例
   */
  getAIService(): AIService | null {
    return this.aiService;
  }

  /**
   * Parse natural language input into a shell command
   * 将自然语言输入解析为 Shell 命令
   * 
   * Flow:
   * 1. Sanitize input using PrivacyFilter (Requirement 3.1-3.4)
   * 2. Send sanitized input to AI service (Requirement 1.1)
   * 3. Restore original values in the command (Requirement 3.4)
   * 4. Check command for dangerous patterns (Requirement 4.1-4.2)
   * 5. Return parse result with command and metadata (Requirement 1.2)
   * 
   * Requirements: 1.1, 1.2, 1.4, 1.6
   */
  async parseNaturalLanguage(
    input: string,
    context: CommandContext
  ): Promise<ParseResult> {
    // Validate input
    if (!input || input.trim().length === 0) {
      return {
        success: false,
        confidence: 0,
        isDangerous: false,
        error: 'Input cannot be empty',
      };
    }

    // Check if AI service is initialized
    if (!this.aiService) {
      return {
        success: false,
        confidence: 0,
        isDangerous: false,
        error: 'AI service not initialized. Please configure an AI provider in settings.',
      };
    }

    try {
      // Create abort controller for timeout handling (Requirement 1.6)
      this.abortController = new AbortController();

      // Step 1: Sanitize input using PrivacyFilter (Requirements 3.1-3.3)
      const { sanitized, mapping } = this.privacyFilter.sanitize(input);

      console.log('Original input:', input);
      console.log('Sanitized input:', sanitized);
      console.log('Detected sensitive types:', Object.keys(mapping).length);

      // Step 2: Send sanitized input to AI service (Requirement 1.1)
      const options: AIRequestOptions = {
        timeout: 30000, // 30 秒超时（手机网络可能较慢，Gemini API 响应时间约 5-10 秒）
        conversationHistory: context.conversationHistory,
      };

      const aiResponse = await this.aiService.sendRequest(sanitized, options);

      console.log('AI response:', aiResponse);

      // Step 3: Restore original values in the command (Requirement 3.4)
      const restoredCommand = this.privacyFilter.restore(
        aiResponse.command,
        mapping
      );

      console.log('Restored command:', restoredCommand);

      // Step 4: Check command for dangerous patterns (Requirements 4.1-4.2)
      const securityCheck = this.securityChecker.checkCommand(restoredCommand);

      console.log('Security check:', securityCheck);

      // Step 5: Return parse result (Requirement 1.2)
      return {
        success: true,
        command: restoredCommand,
        explanation: aiResponse.explanation,
        confidence: aiResponse.confidence,
        isDangerous: securityCheck.isDangerous,
        requiresConfirmation: securityCheck.requiresConfirmation, // ✨ 新增
        riskLevel: securityCheck.riskLevel, // ✨ 新增
        error: undefined,
      };
    } catch (error) {
      console.error('Error parsing natural language:', error);

      // Handle timeout errors (Requirement 1.6)
      if (error instanceof Error && error.message.includes('timeout')) {
        return {
          success: false,
          confidence: 0,
          isDangerous: false,
          error: 'Request timeout: AI service did not respond in time. Please try again.',
        };
      }

      // Handle parsing errors (Requirement 1.4)
      return {
        success: false,
        confidence: 0,
        isDangerous: false,
        error: error instanceof Error 
          ? error.message 
          : 'Failed to parse natural language input. Please try rephrasing your request.',
      };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * 通过 SSH 执行命令（使用标记法可靠捕获输出）
   *
   * 使用 sshService.writeAndWait() 替代旧的 500ms 超时方案，
   * 通过在命令后追加唯一标记来准确检测命令是否执行完毕。
   *
   * @param command 要执行的命令
   * @param deviceId 目标设备 ID
   * @param sessionId SSH 会话 ID
   * @param onOutput 可选的流式输出回调
   * @returns 执行结果（包含输出和退出码）
   */
  async executeCommand(
    command: string,
    _deviceId: string,
    sessionId: string,
    onOutput?: (output: string) => void
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // 校验输入
      if (!command || command.trim().length === 0) {
        return {
          success: false,
          output: '',
          exitCode: -1,
          executionTime: 0,
          error: '命令不能为空',
        };
      }

      // 检查 SSH 会话是否已连接
      if (!this.sshService.isConnected(sessionId)) {
        return {
          success: false,
          output: '',
          exitCode: -1,
          executionTime: 0,
          error: 'SSH 会话未连接',
        };
      }

      // 使用标记法执行命令并等待输出完成
      const { output, timedOut } = await this.sshService.writeAndWait(sessionId, command);

      // 通知流式输出回调
      if (onOutput && output) {
        onOutput(output);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: !timedOut,
        output: output || (timedOut ? '命令执行超时' : '无输出'),
        exitCode: timedOut ? -1 : 0,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error('执行命令出错:', error);

      return {
        success: false,
        output: '',
        exitCode: -1,
        executionTime,
        error: error instanceof Error
          ? error.message
          : '执行命令失败',
      };
    }
  }

  /**
   * Get device context for AI parsing
   * 获取设备上下文用于 AI 解析
   * 
   * @param deviceId Device ID
   * @param sessionId SSH session ID
   * @returns Command context with device information
   */
  async getDeviceContext(
    deviceId: string,
    sessionId: string
  ): Promise<Partial<CommandContext>> {
    const session = this.sshService.getSession(sessionId);
    
    if (!session) {
      return {
        deviceId,
        os: 'unknown',
        shell: 'bash',
        currentDirectory: '~',
      };
    }

    return {
      deviceId,
      deviceName: session.device.name,
      os: this.detectOS(session.device.hostname),
      shell: 'bash', // TODO: Detect shell type
      currentDirectory: '~', // TODO: Get current directory from session
    };
  }

  /**
   * Detect OS from hostname
   * 从主机名检测操作系统
   */
  private detectOS(hostname: string): string {
    const lower = hostname.toLowerCase();
    
    if (lower.includes('mac') || lower.includes('darwin')) {
      return 'macos';
    }
    if (lower.includes('win') || lower.includes('windows')) {
      return 'windows';
    }
    if (lower.includes('ubuntu') || lower.includes('debian') || lower.includes('linux')) {
      return 'linux';
    }
    
    return 'linux'; // 默认 Linux
  }

  /**
   * 采集远程机器上下文信息
   *
   * 通过执行几条轻量级只读命令，获取远程机器的实时状态，
   * 用于注入 AI 的 system prompt 以提高命令生成的准确性。
   *
   * @param sessionId SSH 会话 ID
   * @returns 远程机器上下文
   */
  async gatherContext(sessionId: string): Promise<RemoteContext> {
    const runCmd = async (cmd: string, fallback: string = ''): Promise<string> => {
      try {
        const { output } = await this.sshService.writeAndWait(sessionId, cmd, 5000);
        return output.trim() || fallback;
      } catch {
        return fallback;
      }
    };

    // 并行采集 5 条轻量命令的结果
    const [pwd, whoami, hostname, uname, dfSummary] = await Promise.all([
      runCmd('pwd', '~'),
      runCmd('whoami', 'user'),
      runCmd('hostname', 'localhost'),
      runCmd('uname -a', 'unknown'),
      runCmd('df -h | head -4', 'unknown'),
    ]);

    return { pwd, whoami, hostname, uname, dfSummary };
  }

  /**
   * Cancel ongoing parsing request
   * 取消正在进行的解析请求
   * 
   * Aborts the current AI service request if one is in progress.
   * 如果有正在进行的 AI 服务请求，则中止它。
   */
  cancelParsing(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      console.log('Parsing request cancelled');
    }
  }
}

/**
 * Singleton instance
 * 单例实例
 */
let nlControllerInstance: NLController | null = null;

/**
 * Get NLController singleton instance
 * 获取自然语言控制器单例实例
 * 
 * @returns NLController instance
 */
export function getNLController(): NLController {
  if (!nlControllerInstance) {
    nlControllerInstance = new NLController();
  }
  return nlControllerInstance;
}

/**
 * Reset NLController singleton (for testing)
 * 重置自然语言控制器单例（用于测试）
 */
export function resetNLController(): void {
  nlControllerInstance = null;
}

export default NLController;
