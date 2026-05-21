/**
 * SiliconFlow Service (Simplified)
 * 硅基流动服务（简化版）
 * 
 * 使用 AIProviderFactory 创建实例，消除重复代码
 */

import { AIProviderFactory } from './AIProviderFactory';

export class SiliconFlowService {
  static create(apiKey: string, timeout?: number) {
    return AIProviderFactory.create('siliconflow', apiKey, timeout);
  }
}
