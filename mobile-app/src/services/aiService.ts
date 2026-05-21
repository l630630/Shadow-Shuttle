/**
 * AI Service Interface
 * AI 服务接口
 * 
 * This module defines the abstract interface for AI services that parse
 * natural language commands into shell commands.
 * 
 * 本模块定义了 AI 服务的抽象接口，用于将自然语言命令解析为 Shell 命令。
 */

import {
  AIRequestOptions,
  AIResponse,
  ServiceStatus,
  CommandContext,
} from '../types/nlc';

/**
 * Abstract AI Service Interface
 * 抽象 AI 服务接口
 * 
 * All AI service providers (OpenAI, Claude, etc.) must implement this interface.
 * 所有 AI 服务提供商（OpenAI、Claude 等）必须实现此接口。
 */
export interface AIService {
  /**
   * Send a request to the AI service to parse natural language into a command
   * 向 AI 服务发送请求，将自然语言解析为命令
   * 
   * @param prompt - The natural language prompt to parse / 要解析的自然语言提示
   * @param options - Request options including timeout, temperature, etc. / 请求选项，包括超时、温度等
   * @returns Promise resolving to the AI response / 解析为 AI 响应的 Promise
   * @throws Error if the request fails or times out / 如果请求失败或超时则抛出错误
   * 
   * Requirements: 1.1, 10.4, 10.6
   */
  sendRequest(
    prompt: string,
    options: AIRequestOptions
  ): Promise<AIResponse>;

  /**
   * Validate an API key for this service
   * 验证此服务的 API 密钥
   * 
   * @param apiKey - The API key to validate / 要验证的 API 密钥
   * @returns Promise resolving to true if valid, false otherwise / 如果有效则解析为 true，否则为 false
   * 
   * Requirements: 10.4
   */
  validateAPIKey(apiKey: string): Promise<boolean>;

  /**
   * Get the current status of the AI service
   * 获取 AI 服务的当前状态
   * 
   * @returns Promise resolving to the service status / 解析为服务状态的 Promise
   * 
   * Requirements: 10.6
   */
  getServiceStatus(): Promise<ServiceStatus>;
}

/**
 * Base AI Service Implementation
 * AI 服务基础实现
 * 
 * Provides common functionality for all AI service implementations.
 * 为所有 AI 服务实现提供通用功能。
 */
export abstract class BaseAIService implements AIService {
  protected apiKey: string;
  protected timeout: number;

  constructor(apiKey: string, timeout: number = 5000) {
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  abstract sendRequest(
    prompt: string,
    options: AIRequestOptions
  ): Promise<AIResponse>;

  abstract validateAPIKey(apiKey: string): Promise<boolean>;

  abstract getServiceStatus(): Promise<ServiceStatus>;

  /**
   * Build a system prompt for command parsing
   * 构建用于命令解析的系统提示
   * 
   * @param context - The command context / 命令上下文
   * @returns The system prompt / 系统提示
   */
  protected buildSystemPrompt(context: CommandContext): string {
    const { deviceInfo, currentDirectory, remoteContext } = context;
    const isMac = deviceInfo.os === 'macos';

    const macGuiRule = isMac
      ? `
macOS GUI apps: To OPEN applications (e.g. 微信 WeChat, QQ, Safari, Chrome, 钉钉), use: open -a "AppName". Examples: open -a "WeChat", open -a "微信", open -a "QQ", open -a "Safari". Do NOT use wechat, qq, safari as shell commands (they do not exist on macOS).`
      : '';

    // 远程机器实时上下文（如果有）
    const remoteContextBlock = remoteContext
      ? `
Remote machine state (实时状态):
- Current directory: ${remoteContext.pwd}
- User: ${remoteContext.whoami}
- Hostname: ${remoteContext.hostname}
- OS: ${remoteContext.uname}
- Disk: ${remoteContext.dfSummary.split('\n').slice(0, 3).join('; ')}`
      : '';

    return `You are a shell command assistant for ${deviceInfo.os} (${deviceInfo.shell}).
Current directory: ${currentDirectory}${remoteContextBlock}

CRITICAL: You MUST respond with ONLY a JSON object. No other text.

JSON format (required):
{"command": "the shell command", "explanation": "brief explanation", "confidence": 0.95}

Examples:
User: "list files"
Response: {"command": "ls -la", "explanation": "List all files including hidden ones", "confidence": 0.95}

User: "show disk usage"
Response: {"command": "df -h", "explanation": "Display disk usage in human-readable format", "confidence": 0.9}
${isMac ? `
User: "打开微信" or "open WeChat"
Response: {"command": "open -a \"WeChat\"", "explanation": "Open WeChat app on macOS", "confidence": 0.95}

User: "打开QQ"
Response: {"command": "open -a \"QQ\"", "explanation": "Open QQ app on macOS", "confidence": 0.95}

User: "给微信联系人健健发消息为 1"
Response: {"command": "bash ~/YS/mac-automation/send_wechat_message.sh \"健健\" \"1\"", "explanation": "Send message '1' to WeChat contact 健健", "confidence": 0.95}

User: "给630发消息为2" or "给 630 发消息为 2"
Response: {"command": "bash ~/YS/mac-automation/send_wechat_message.sh \"630\" \"2\"", "explanation": "Send message '2' to WeChat contact 630", "confidence": 0.95}

User: "给QQ联系人健健发消息为 1"
Response: {"command": "bash ~/YS/mac-automation/send_qq_message.sh \"健健\" \"1\"", "explanation": "Send message '1' to QQ contact 健健", "confidence": 0.95}` : ''}

Rules:
- ALWAYS respond with JSON only
- Use appropriate commands for ${deviceInfo.shell}
- Consider current directory for paths
- Set confidence < 0.7 if uncertain
- On macOS, for WeChat/QQ messages use: bash ~/YS/mac-automation/send_wechat_message.sh "联系人" "消息" or bash ~/YS/mac-automation/send_qq_message.sh "联系人" "消息". Do NOT use bare send_wechat_message (not in PATH). Do NOT use sendmsg or echo/pipe.${macGuiRule}`;
  }

  /**
   * Parse AI response and extract command information
   * 解析 AI 响应并提取命令信息
   * 
   * @param rawResponse - The raw response from the AI service / AI 服务的原始响应
   * @returns Parsed AI response / 解析后的 AI 响应
   * @throws Error if response cannot be parsed / 如果无法解析响应则抛出错误
   */
  protected parseResponse(rawResponse: string): AIResponse {
    console.log('🔍 Parsing AI response:', rawResponse.substring(0, 500));
    
    try {
      // 移除 <think> 标签内容（Gemini thinking 模型会包含这些）
      let cleanedResponse = rawResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      console.log('🧹 Cleaned response:', cleanedResponse.substring(0, 300));
      
      // Try to extract JSON from the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        console.log('✅ Found JSON:', jsonMatch[0]);
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          command: parsed.command || '',
          explanation: parsed.explanation || '',
          confidence: parsed.confidence || 0.5,
          rawResponse,
        };
      }
      
      // 如果没有找到 JSON，尝试从代码块中提取
      const codeBlockMatch = cleanedResponse.match(/```(?:json|bash|sh)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        const codeContent = codeBlockMatch[1].trim();
        console.log('📦 Found code block:', codeContent);
        
        // 检查是否是 JSON
        if (codeContent.startsWith('{')) {
          try {
            const parsed = JSON.parse(codeContent);
            return {
              command: parsed.command || '',
              explanation: parsed.explanation || '',
              confidence: parsed.confidence || 0.5,
              rawResponse,
            };
          } catch (e) {
            console.log('⚠️ JSON parse failed, treating as command');
          }
        }
        
        // 如果是命令，直接使用
        return {
          command: codeContent,
          explanation: 'Extracted from code block',
          confidence: 0.7,
          rawResponse,
        };
      }
      
      // 如果是纯文本响应，尝试智能提取
      console.log('⚠️ No JSON or code block found, trying text extraction');
      
      // 检查是否是问候语或非命令响应
      const greetings = ['hello', 'hi', '你好', '您好', 'greetings'];
      const lowerResponse = cleanedResponse.toLowerCase();
      if (greetings.some(g => lowerResponse.includes(g))) {
        return {
          command: 'echo "Hello! How can I help you?"',
          explanation: '这是一个问候语，不是命令请求',
          confidence: 0.3,
          rawResponse,
        };
      }
      
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('❌ Parse error:', error);
      
      // If parsing fails, try to extract command from text
      const lines = rawResponse.split('\n');
      
      // 查找命令行（以 $, >, 或包含 command: 的行）
      const commandLine = lines.find(line => 
        line.trim().startsWith('$') || 
        line.trim().startsWith('>') ||
        line.includes('command:') ||
        line.match(/^[a-z]+\s+/)  // 简单命令模式
      );

      if (commandLine) {
        const command = commandLine
          .replace(/^\$\s*/, '')
          .replace(/^>\s*/, '')
          .replace(/command:\s*/i, '')
          .trim();

        return {
          command,
          explanation: 'Extracted from AI response',
          confidence: 0.6,
          rawResponse,
        };
      }

      throw new Error('Failed to parse AI response: ' + rawResponse.substring(0, 200));
    }
  }

  /**
   * Create a timeout promise
   * 创建超时 Promise
   * 
   * @param ms - Timeout in milliseconds / 超时时间（毫秒）
   * @returns Promise that rejects after timeout / 超时后拒绝的 Promise
   */
  protected createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${ms}ms`));
      }, ms);
    });
  }
}
