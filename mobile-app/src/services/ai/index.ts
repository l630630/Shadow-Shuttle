/**
 * AI Services Export
 * AI 服务导出
 * 
 * This module exports all AI service implementations.
 * 本模块导出所有 AI 服务实现。
 */

export { AIService, BaseAIService } from '../aiService';
export { OpenAIService } from '../openAIService';
export { ClaudeService } from '../claudeService';

/**
 * Factory function to create an AI service instance
 * 创建 AI 服务实例的工厂函数
 * 
 * @param provider - The AI provider ('openai' or 'claude')
 * @param apiKey - The API key for the provider
 * @param timeout - Optional timeout in milliseconds (default: 5000)
 * @returns An instance of the appropriate AI service
 */
export function createAIService(
  provider: 'openai' | 'claude',
  apiKey: string,
  timeout?: number
) {
  switch (provider) {
    case 'openai':
      const { OpenAIService } = require('../openAIService');
      return new OpenAIService(apiKey, timeout);
    case 'claude':
      const { ClaudeService } = require('../claudeService');
      return new ClaudeService(apiKey, timeout);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
