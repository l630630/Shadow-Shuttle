/**
 * SiliconFlow Service Implementation
 * 硅基流动服务实现
 * 
 * This module implements the AIService interface for SiliconFlow's API.
 * 本模块为硅基流动的 API 实现 AIService 接口。
 * 
 * SiliconFlow is a Chinese AI service provider with OpenAI-compatible API.
 * 硅基流动是一个国内 AI 服务提供商，提供兼容 OpenAI 的 API。
 * 
 * Features:
 * - OpenAI-compatible API format
 * - Multiple models support (Qwen, DeepSeek, etc.)
 * - Fast response time in China
 * - Affordable pricing
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

/**
 * SiliconFlow API Response Interface
 * 硅基流动 API 响应接口
 */
interface SiliconFlowMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface SiliconFlowChoice {
  message: SiliconFlowMessage;
  finish_reason: string;
  index: number;
}

interface SiliconFlowResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: SiliconFlowChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface SiliconFlowErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * SiliconFlow Service Implementation
 * 硅基流动服务实现
 * 
 * Implements natural language to command parsing using SiliconFlow's API.
 * 使用硅基流动的 API 实现自然语言到命令的解析。
 */
export class SiliconFlowService extends BaseAIService {
  private readonly apiUrl: string = 'https://api.siliconflow.cn/v1/chat/completions';
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(
    apiKey: string, 
    timeout: number = 10000,
    model: string = 'Qwen/Qwen3-VL-32B-Instruct'
  ) {
    super(apiKey, timeout);
    
    this.model = model;
    this.maxTokens = 2048;
    this.temperature = 0.7;
  }

  /**
   * Send a request to SiliconFlow API
   * 向硅基流动 API 发送请求
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

    // Build messages array
    const messages: SiliconFlowMessage[] = [];

    // Add conversation history if provided
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      // Add system prompt first
      const context = this.extractContextFromHistory(options.conversationHistory);
      messages.push({
        role: 'system',
        content: this.buildSystemPrompt(context),
      });

      // Add conversation history (limit to last 10 messages to avoid token limits)
      const recentHistory = options.conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    } else {
      // No history, create a basic context
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

      messages.push({
        role: 'system',
        content: this.buildSystemPrompt(basicContext),
      });
    }

    // Add current user prompt
    messages.push({
      role: 'user',
      content: prompt,
    });

    // Prepare request body
    const requestBody = {
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
      response_format: { type: 'json_object' },
    };

    try {
      // Create fetch promise
      const fetchPromise = fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
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
        const errorData: SiliconFlowErrorResponse = await response.json();
        
        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Invalid API key: Please check your SiliconFlow API key');
        }
        if (response.status === 429) {
          throw new Error('Quota exceeded: Your SiliconFlow API quota has been exceeded');
        }
        
        throw new Error(
          `SiliconFlow API error: ${errorData.error.message} (${errorData.error.type})`
        );
      }

      // Parse response
      const data: SiliconFlowResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from SiliconFlow API');
      }

      const rawResponse = data.choices[0].message.content;

      // Parse and return the response
      return this.parseResponse(rawResponse);
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('timeout')) {
          throw new Error('Request timeout: SiliconFlow API did not respond in time');
        }
        if (error.message.includes('invalid_api_key') || error.message.includes('Invalid API key')) {
          throw new Error('Invalid API key: Please check your SiliconFlow API key');
        }
        if (error.message.includes('quota') || error.message.includes('Quota exceeded')) {
          throw new Error('Quota exceeded: Your SiliconFlow API quota has been exceeded');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while calling SiliconFlow API');
    }
  }

  /**
   * Validate SiliconFlow API key
   * 验证硅基流动 API 密钥
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
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: 'test',
            },
          ],
          max_tokens: 5,
          stream: false,
        }),
      });

      // If we get a 401, the key is invalid
      if (response.status === 401) {
        return false;
      }

      // If we get a 200 or other non-auth error, the key is valid
      return response.ok || response.status !== 401;
    } catch (error) {
      // Network errors don't mean the key is invalid
      console.error('Error validating SiliconFlow API key:', error);
      return false;
    }
  }

  /**
   * Get SiliconFlow service status
   * 获取硅基流动服务状态
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
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'user',
                content: 'ping',
              },
            ],
            max_tokens: 5,
            stream: false,
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
      const errorData: SiliconFlowErrorResponse = await response.json();
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
