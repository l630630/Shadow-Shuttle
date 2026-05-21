/**
 * AI Provider Factory
 * AI 提供商工厂
 * 
 * 统一的 AI 服务提供商工厂，消除重复代码
 * 使用策略模式 + 工厂模式实现
 */

import { BaseAIService } from '../aiService';
import {
  AIRequestOptions,
  AIResponse,
  ServiceStatus,
  CommandContext,
} from '../../types/nlc';

/**
 * AI Provider 配置接口
 */
export interface AIProviderConfig {
  apiUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  headers: (apiKey: string) => Record<string, string>;
  buildRequestBody: (
    messages: any[],
    systemPrompt: string,
    options: {
      maxTokens: number;
      temperature: number;
    }
  ) => any;
  parseResponse: (data: any) => string;
  validateStatus: (status: number) => boolean;
}

/**
 * OpenAI 格式的 Provider 配置
 */
export const OpenAIFormatConfig: AIProviderConfig = {
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4',
  maxTokens: 2048,
  temperature: 0.7,
  
  headers: (apiKey: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }),
  
  buildRequestBody: (messages, systemPrompt, options) => ({
    model: OpenAIFormatConfig.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: options.maxTokens,
    temperature: options.temperature,
    response_format: { type: 'json_object' },
  }),
  
  parseResponse: (data: any) => {
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from API');
    }
    return data.choices[0].message.content;
  },
  
  validateStatus: (status: number) => status !== 401,
};

/**
 * Claude 格式的 Provider 配置
 */
export const ClaudeFormatConfig: AIProviderConfig = {
  apiUrl: 'https://api.anthropic.com/v1/messages',
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 2048,
  temperature: 0.7,
  
  headers: (apiKey: string) => ({
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  }),
  
  buildRequestBody: (messages, systemPrompt, options) => ({
    model: ClaudeFormatConfig.model,
    max_tokens: options.maxTokens,
    temperature: options.temperature,
    system: systemPrompt,
    messages,
  }),
  
  parseResponse: (data: any) => {
    if (!data.content || data.content.length === 0) {
      throw new Error('No response from API');
    }
    return data.content[0].text;
  },
  
  validateStatus: (status: number) => status !== 401 && status !== 403,
};

/**
 * Gemini 格式的 Provider 配置
 */
export const GeminiFormatConfig: AIProviderConfig = {
  apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  model: 'gemini-1.5-flash',
  maxTokens: 2048,
  temperature: 0.7,
  
  headers: (apiKey: string) => ({
    'Content-Type': 'application/json',
  }),
  
  buildRequestBody: (messages, systemPrompt, options) => {
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
    
    return {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
        responseMimeType: 'application/json',
      },
    };
  },
  
  parseResponse: (data: any) => {
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from API');
    }
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Empty response from API');
    }
    return candidate.content.parts[0].text;
  },
  
  validateStatus: (status: number) => status !== 400 && status !== 403,
};

/**
 * 通用 AI Provider 实现
 * 使用配置对象来适配不同的 API 格式
 */
export class GenericAIProvider extends BaseAIService {
  private config: AIProviderConfig;
  private providerName: string;

  constructor(
    apiKey: string,
    config: AIProviderConfig,
    providerName: string,
    timeout: number = 10000
  ) {
    super(apiKey, timeout);
    this.config = config;
    this.providerName = providerName;
  }

  async sendRequest(
    prompt: string,
    options: AIRequestOptions
  ): Promise<AIResponse> {
    const timeout = options.timeout || this.timeout;
    const maxTokens = options.maxTokens || this.config.maxTokens;
    const temperature = options.temperature || this.config.temperature;

    // 构建系统提示
    const context = this.extractContext(options);
    const systemPrompt = this.buildSystemPrompt(context);

    // 构建消息数组
    const messages = this.buildMessages(options, prompt);

    // 构建请求体
    const requestBody = this.config.buildRequestBody(messages, systemPrompt, {
      maxTokens,
      temperature,
    });

    try {
      // 发送请求
      const fetchPromise = fetch(this.config.apiUrl, {
        method: 'POST',
        headers: this.config.headers(this.apiKey),
        body: JSON.stringify(requestBody),
      });

      const response = await Promise.race([
        fetchPromise,
        this.createTimeoutPromise(timeout),
      ]);

      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `${this.providerName} API error: ${JSON.stringify(errorData)}`
        );
      }

      // 解析响应
      const data = await response.json();
      const rawResponse = this.config.parseResponse(data);

      // 返回解析后的响应
      return this.parseResponse(rawResponse);
    } catch (error) {
      if (error instanceof Error) {
        // 处理特定错误类型
        if (error.message.includes('timeout')) {
          throw new Error(`Request timeout: ${this.providerName} API did not respond in time`);
        }
        if (error.message.includes('401') || error.message.includes('403') || error.message.includes('invalid_api_key')) {
          throw new Error(`Invalid API key: Please check your ${this.providerName} API key`);
        }
        if (error.message.includes('429') || error.message.includes('quota')) {
          throw new Error(`Quota exceeded: Your ${this.providerName} API quota has been exceeded`);
        }
        throw error;
      }
      throw new Error(`Unknown error occurred while calling ${this.providerName} API`);
    }
  }

  async validateAPIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: this.config.headers(apiKey),
        body: JSON.stringify(
          this.config.buildRequestBody(
            [{ role: 'user', content: 'test' }],
            'You are a test assistant.',
            { maxTokens: 10, temperature: 0.7 }
          )
        ),
      });

      return this.config.validateStatus(response.status);
    } catch (error) {
      console.error(`Error validating ${this.providerName} API key:`, error);
      return false;
    }
  }

  async getServiceStatus(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      const response = await Promise.race([
        fetch(this.config.apiUrl, {
          method: 'POST',
          headers: this.config.headers(this.apiKey),
          body: JSON.stringify(
            this.config.buildRequestBody(
              [{ role: 'user', content: 'ping' }],
              'You are a test assistant.',
              { maxTokens: 10, temperature: 0.7 }
            )
          ),
        }),
        this.createTimeoutPromise(5000),
      ]);

      const latency = Date.now() - startTime;

      if (response.ok) {
        return { available: true, latency };
      }

      const errorData = await response.json();
      return {
        available: false,
        latency,
        error: JSON.stringify(errorData),
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
   * 提取上下文
   */
  private extractContext(options: AIRequestOptions): CommandContext {
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      const lastMessage = options.conversationHistory[options.conversationHistory.length - 1];
      if (lastMessage?.metadata?.context) {
        return {
          ...lastMessage.metadata.context,
          conversationHistory: options.conversationHistory,
        };
      }
    }

    return {
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
      conversationHistory: options.conversationHistory || [],
    };
  }

  /**
   * 构建消息数组
   */
  private buildMessages(options: AIRequestOptions, prompt: string): any[] {
    const messages: any[] = [];

    // 添加对话历史（限制最近 10 条）
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

    // 添加当前提示
    messages.push({
      role: 'user',
      content: prompt,
    });

    return messages;
  }
}

/**
 * AI Provider Factory
 * 根据提供商名称创建对应的 AI Service 实例
 */
export class AIProviderFactory {
  static create(
    provider: 'openai' | 'claude' | 'gemini' | 'siliconflow' | 'deepseek',
    apiKey: string,
    timeout?: number
  ): BaseAIService {
    switch (provider) {
      case 'openai':
        return new GenericAIProvider(
          apiKey,
          {
            ...OpenAIFormatConfig,
            apiUrl: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4',
          },
          'OpenAI',
          timeout
        );

      case 'claude':
        return new GenericAIProvider(
          apiKey,
          ClaudeFormatConfig,
          'Claude',
          timeout
        );

      case 'gemini':
        // 检测是否使用自定义端点
        const isCustomEndpoint = apiKey.startsWith('sk-');
        if (isCustomEndpoint) {
          return new GenericAIProvider(
            apiKey,
            {
              ...OpenAIFormatConfig,
              apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
              model: 'google/gemini-2.0-flash-thinking-exp-01-21',
            },
            'Gemini (Custom)',
            timeout || 30000
          );
        } else {
          return new GenericAIProvider(
            apiKey,
            {
              ...GeminiFormatConfig,
              apiUrl: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            },
            'Gemini',
            timeout
          );
        }

      case 'siliconflow':
        return new GenericAIProvider(
          apiKey,
          {
            ...OpenAIFormatConfig,
            apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
            model: 'Qwen/Qwen2.5-7B-Instruct',  // 修正为正确的模型名称
          },
          'SiliconFlow',
          timeout || 10000
        );

      case 'deepseek':
        return new GenericAIProvider(
          apiKey,
          {
            ...OpenAIFormatConfig,
            apiUrl: 'https://api.deepseek.com/v1/chat/completions',
            model: 'deepseek-chat',
          },
          'DeepSeek',
          timeout || 10000
        );

      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }
}
