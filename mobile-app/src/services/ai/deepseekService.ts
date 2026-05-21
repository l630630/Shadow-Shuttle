/**
 * DeepSeek Service (Simplified)
 * DeepSeek 服务（简化版）
 * 
 * 使用 AIProviderFactory 创建实例，消除重复代码
 */

import { AIProviderFactory } from './AIProviderFactory';

export class DeepSeekService {
  static create(apiKey: string, timeout?: number) {
    return AIProviderFactory.create('deepseek', apiKey, timeout);
  }
}
