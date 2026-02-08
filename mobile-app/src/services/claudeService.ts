/**
 * Claude Service Implementation
 * Claude 服务实现
 * 
 * This module implements the AIService interface for Anthropic's Claude 3.5 Sonnet API.
 * 本模块为 Anthropic 的 Claude 3.5 Sonnet API 实现 AIService 接口。
 * 
 * Requirements: 1.1, 1.6, 10.4
 */

import { BaseAIService } from './aiService';
import {
  AIRequestOptions,
  AIResponse,
  ServiceStatus,
  CommandContext,
} from '../types/nlc';
import { AI_SERVICE_CONFIG } from '../config/nlc-constants';

/**
 * Claude API Message Interface
 * Claude API 消息接口
 */
interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeContent {
  type: 'text';
  text: string;
}

interface ClaudeResponseMessage {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ClaudeContent[];
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ClaudeErrorResponse {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

/**
 * Claude Service Implementation
 * Claude 服务实现
 * 
 * Implements natural language to command parsing using Anthropic's Claude 3.5 Sonnet API.
 * 使用 Anthropic 的 Claude 3.5 Sonnet API 实现自然语言到命令的解析。
 */
export class ClaudeService extends BaseAIService {
  private readonly apiUrl: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(apiKey: string, timeout: number = 5000) {
    super(apiKey, timeout);
    
    const config = AI_SERVICE_CONFIG.claude;
    this.apiUrl = config.apiUrl;
    this.model = config.model;
    this.maxTokens = config.maxTokens;
    this.temperature = config.temperature;
  }

  /**
   * Send a request to Claude API
   * 向 Claude API 发送请求
   * 
   * @param prompt - The natural language prompt / 自然语言提示
   * @param options - Request options / 请求选项
   * @returns Promise resolving to AI response / 解析为 AI 响应的 Promise
   * @throws Error if request fails or times out / 如果请求失败或超时则抛出错误
   * 
   * Requirements: 1.1, 1.6
   */
  async sendRequest(
    prompt: string,
    options: AIRequestOptions
  ): Promise<AIResponse> {
    const timeout = options.timeout || this.timeout;
    const maxTokens = options.maxTokens || this.maxTokens;
    const temperature = options.temperature || this.temperature;

    // Build system prompt
    let systemPrompt: string;
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      const context = this.extractContextFromHistory(options.conversationHistory);
      systemPrompt = this.buildSystemPrompt(context);
    } else {
      const basicContext: CommandContext = {
        currentDirectory: '~',
        deviceInfo: {
          id: 'unknown',
          name: 'unknown',
          os: 'linux',
          shell: 'bash',
          currentDirectory: '~',
          username: 'user',
          hostname: 'localhost',
        },
        recentCommands: [],
        conversationHistory: [],
      };
      systemPrompt = this.buildSystemPrompt(basicContext);
    }

    // Build messages array
    const messages: ClaudeMessage[] = [];

    // Add conversation history if provided (limit to last 10 messages)
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      const recentHistory = options.conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    }

    // Add current user prompt
    messages.push({
      role: 'user',
      content: prompt,
    });

    // Prepare request body
    const requestBody = {
      model: this.model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages,
    };

    try {
      // Create fetch promise
      const fetchPromise = fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetchPromise,
        this.createTimeoutPromise(timeout),
      ]);

      // Check response status
      if (!response.ok) {
        const errorData: ClaudeErrorResponse = await response.json();
        throw new Error(
          `Claude API error: ${errorData.error.message} (${errorData.error.type})`
        );
      }

      // Parse response
      const data: ClaudeResponseMessage = await response.json();

      if (!data.content || data.content.length === 0) {
        throw new Error('No response from Claude API');
      }

      const rawResponse = data.content[0].text;

      // Parse and return the response
      return this.parseResponse(rawResponse);
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('timeout')) {
          throw new Error('Request timeout: Claude API did not respond in time');
        }
        if (error.message.includes('invalid_api_key') || error.message.includes('authentication')) {
          throw new Error('Invalid API key: Please check your Claude API key');
        }
        if (error.message.includes('rate_limit') || error.message.includes('quota')) {
          throw new Error('Quota exceeded: Your Claude API quota has been exceeded');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while calling Claude API');
    }
  }

  /**
   * Validate Claude API key
   * 验证 Claude API 密钥
   * 
   * @param apiKey - The API key to validate / 要验证的 API 密钥
   * @returns Promise resolving to true if valid / 如果有效则解析为 true
   * 
   * Requirements: 10.4
   */
  async validateAPIKey(apiKey: string): Promise<boolean> {
    try {
      // Make a minimal request to validate the key
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'test',
            },
          ],
        }),
      });

      // If we get a 401 or 403, the key is invalid
      if (response.status === 401 || response.status === 403) {
        return false;
      }

      // If we get a 200 or other non-auth error, the key is valid
      return response.ok || (response.status !== 401 && response.status !== 403);
    } catch (error) {
      // Network errors don't mean the key is invalid
      console.error('Error validating Claude API key:', error);
      return false;
    }
  }

  /**
   * Get Claude service status
   * 获取 Claude 服务状态
   * 
   * @returns Promise resolving to service status / 解析为服务状态的 Promise
   * 
   * Requirements: 10.6
   */
  async getServiceStatus(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      // Make a minimal request to check service availability
      const response = await Promise.race([
        fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: 10,
            messages: [
              {
                role: 'user',
                content: 'ping',
              },
            ],
          }),
        }),
        this.createTimeoutPromise(5000),
      ]);

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          available: true,
          latency,
        };
      }

      // Service responded but with an error
      const errorData: ClaudeErrorResponse = await response.json();
      return {
        available: false,
        latency,
        error: errorData.error.message,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        available: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Extract context from conversation history
   * 从对话历史中提取上下文
   * 
   * @param history - Conversation history / 对话历史
   * @returns Command context / 命令上下文
   */
  private extractContextFromHistory(history: any[]): CommandContext {
    // Try to extract context from metadata if available
    const lastMessage = history[history.length - 1];
    
    // Default context
    const defaultContext: CommandContext = {
      currentDirectory: '~',
      deviceInfo: {
        id: 'unknown',
        name: 'unknown',
        os: 'linux',
        shell: 'bash',
        currentDirectory: '~',
        username: 'user',
        hostname: 'localhost',
      },
      recentCommands: [],
      conversationHistory: history,
    };

    // If metadata exists, use it
    if (lastMessage?.metadata?.context) {
      return {
        ...lastMessage.metadata.context,
        conversationHistory: history,
      };
    }

    return defaultContext;
  }
}
