/**
 * Gemini Service Implementation
 * Gemini 服务实现
 * 
 * This module implements the AIService interface for Google's Gemini API.
 * 本模块为 Google 的 Gemini API 实现 AIService 接口。
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
 * Gemini API Response Interface
 * Gemini API 响应接口
 */
interface GeminiContent {
  parts: Array<{
    text: string;
  }>;
  role: string;
}

interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
  index: number;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

interface GeminiErrorResponse {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Gemini Service Implementation
 * Gemini 服务实现
 * 
 * Implements natural language to command parsing using Google's Gemini API.
 * 使用 Google 的 Gemini API 实现自然语言到命令的解析。
 * 
 * Supports both official Google API and OpenAI-compatible custom endpoints.
 * 支持官方 Google API 和 OpenAI 兼容的自定义端点。
 */
export class GeminiService extends BaseAIService {
  private readonly apiUrl: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly useCustomEndpoint: boolean;

  constructor(apiKey: string, timeout: number = 5000) {
    super(apiKey, timeout);
    
    const config = AI_SERVICE_CONFIG.gemini;
    
    // 检测是否使用自定义端点
    // 特殊处理：如果 key 包含特定模式，强制使用自定义端点
    const isThirdPartyKey = apiKey.startsWith('sk-') && 
                           (apiKey.includes('HwMYo') || apiKey.length > 50);
    
    this.useCustomEndpoint = isThirdPartyKey || apiKey.startsWith('sk-');
    
    if (this.useCustomEndpoint) {
      // 使用自定义端点（OpenAI 兼容格式）
      this.apiUrl = `${config.customApiUrl}/chat/completions`;
      this.model = config.recommendedModels[0]; // 使用推荐的模型
      console.log('✓ GeminiService: Using custom endpoint');
      console.log('✓ API URL:', this.apiUrl);
      console.log('✓ Model:', this.model);
    } else {
      // 使用官方 Google API
      this.apiUrl = `${config.apiUrl}?key=${apiKey}`;
      this.model = config.model;
      console.log('✓ GeminiService: Using official Google API');
    }
    
    this.maxTokens = config.maxTokens;
    this.temperature = config.temperature;
  }

  /**
   * Send a request to Gemini API
   * 向 Gemini API 发送请求
   * 
   * Supports both official Google API and OpenAI-compatible custom endpoints.
   * 支持官方 Google API 和 OpenAI 兼容的自定义端点。
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
    if (this.useCustomEndpoint) {
      return this.sendRequestOpenAIFormat(prompt, options);
    } else {
      return this.sendRequestGoogleFormat(prompt, options);
    }
  }

  /**
   * Send request using OpenAI-compatible format (for custom endpoints)
   * 使用 OpenAI 兼容格式发送请求（用于自定义端点）
   */
  private async sendRequestOpenAIFormat(
    prompt: string,
    options: AIRequestOptions
  ): Promise<AIResponse> {
    const timeout = options.timeout || 30000; // 增加到 30 秒（手机网络可能较慢）
    const temperature = options.temperature || this.temperature;

    console.log('🚀 Gemini: Sending request to custom endpoint');
    console.log('📍 URL:', this.apiUrl);
    console.log('🎯 Model:', this.model);
    console.log('⏱️ Timeout:', timeout, 'ms');

    // Build system instruction
    let systemInstruction: string;
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      const context = this.extractContextFromHistory(options.conversationHistory);
      systemInstruction = this.buildSystemPrompt(context);
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
      systemInstruction = this.buildSystemPrompt(basicContext);
    }

    // Build messages array for OpenAI format
    const messages: any[] = [
      {
        role: 'system',
        content: systemInstruction,
      },
    ];

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

    // Prepare request body (OpenAI format)
    // 注意：移除 response_format 参数，因为第三方 API 可能不支持
    const requestBody = {
      model: this.model,
      messages,
      temperature,
      max_tokens: this.maxTokens,
      stream: false, // 关闭流式传输（按照商家推荐）
    };

    try {
      // Create fetch promise
      console.log('📤 Sending request...');
      const fetchPromise = fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('⏳ Waiting for response (timeout:', timeout, 'ms)...');
      
      // Race between fetch and timeout
      const response = await Promise.race([
        fetchPromise,
        this.createTimeoutPromise(timeout),
      ]);

      console.log('✅ Response received:', response.status, response.statusText);

      // Check response status
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(
          `Gemini API error (${response.status}): ${errorText}`
        );
      }

      // Parse response (OpenAI format)
      const data: any = await response.json();
      console.log('📦 Response data:', JSON.stringify(data).substring(0, 200));

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const choice = data.choices[0];
      if (!choice.message || !choice.message.content) {
        throw new Error('Empty response from Gemini API');
      }

      const rawResponse = choice.message.content;

      // Parse and return the response
      return this.parseResponse(rawResponse);
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('timeout')) {
          throw new Error('Request timeout: Gemini API did not respond in time');
        }
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Invalid API key: Please check your Gemini API key');
        }
        if (error.message.includes('429') || error.message.includes('quota')) {
          throw new Error('Quota exceeded: Your Gemini API quota has been exceeded');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while calling Gemini API');
    }
  }

  /**
   * Send request using Google's native format (for official API)
   * 使用 Google 原生格式发送请求（用于官方 API）
   */
  private async sendRequestGoogleFormat(
    prompt: string,
    options: AIRequestOptions
  ): Promise<AIResponse> {
    const timeout = options.timeout || this.timeout;
    const temperature = options.temperature || this.temperature;

    // Build system instruction
    let systemInstruction: string;
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      const context = this.extractContextFromHistory(options.conversationHistory);
      systemInstruction = this.buildSystemPrompt(context);
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
      systemInstruction = this.buildSystemPrompt(basicContext);
    }

    // Build contents array for Gemini
    const contents: any[] = [];

    // Add conversation history if provided (limit to last 10 messages)
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      const recentHistory = options.conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          contents.push({
            role: 'user',
            parts: [{ text: msg.content }],
          });
        } else if (msg.role === 'assistant') {
          contents.push({
            role: 'model',
            parts: [{ text: msg.content }],
          });
        }
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    // Prepare request body
    const requestBody = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        temperature,
        maxOutputTokens: this.maxTokens,
        responseMimeType: 'application/json',
      },
    };

    try {
      // Create fetch promise
      const fetchPromise = fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        const errorData: GeminiErrorResponse = await response.json();
        throw new Error(
          `Gemini API error: ${errorData.error.message} (${errorData.error.status})`
        );
      }

      // Parse response
      const data: GeminiResponse = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Empty response from Gemini API');
      }

      const rawResponse = candidate.content.parts[0].text;

      // Parse and return the response
      return this.parseResponse(rawResponse);
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('timeout')) {
          throw new Error('Request timeout: Gemini API did not respond in time');
        }
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('INVALID_ARGUMENT')) {
          throw new Error('Invalid API key: Please check your Gemini API key');
        }
        if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota')) {
          throw new Error('Quota exceeded: Your Gemini API quota has been exceeded');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while calling Gemini API');
    }
  }

  /**
   * Validate Gemini API key
   * 验证 Gemini API 密钥
   * 
   * @param apiKey - The API key to validate / 要验证的 API 密钥
   * @returns Promise resolving to true if valid / 如果有效则解析为 true
   * 
   * Requirements: 10.4
   */
  async validateAPIKey(apiKey: string): Promise<boolean> {
    try {
      const testUrl = `${AI_SERVICE_CONFIG.gemini.apiUrl}?key=${apiKey}`;
      
      // Make a minimal request to validate the key
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'test' }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
          },
        }),
      });

      // If we get a 400 with INVALID_ARGUMENT or 403, the key is invalid
      if (response.status === 400 || response.status === 403) {
        const errorData: GeminiErrorResponse = await response.json();
        if (errorData.error.message.includes('API_KEY_INVALID')) {
          return false;
        }
      }

      // If we get a 200 or other non-auth error, the key is valid
      return response.ok || (response.status !== 400 && response.status !== 403);
    } catch (error) {
      // Network errors don't mean the key is invalid
      console.error('Error validating Gemini API key:', error);
      return false;
    }
  }

  /**
   * Get Gemini service status
   * 获取 Gemini 服务状态
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
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'ping' }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 10,
            },
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
      const errorData: GeminiErrorResponse = await response.json();
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
