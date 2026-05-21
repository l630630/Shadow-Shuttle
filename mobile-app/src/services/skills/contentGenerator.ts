/**
 * Content Generator
 * 内容生成器
 *
 * Sends custom prompts to the current AI provider and returns raw text responses.
 * Unlike AIService (which is tuned for shell command generation), this is
 * designed for arbitrary content generation tasks like PPT, reports, etc.
 *
 * 与 AIService（用于 shell 命令生成）不同，此模块用于任意内容生成任务。
 */

import { apiKeyStore } from '../../stores/apiKeyStore';
import type { AIProvider } from '../../types/nlc';

const PROVIDER_CONFIG: Record<AIProvider, {
  url: string;
  model: string;
  buildHeaders: (apiKey: string) => Record<string, string>;
  buildBody: (systemPrompt: string, userPrompt: string, maxTokens: number) => object;
  extractContent: (data: any) => string;
}> = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4',
    buildHeaders: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    }),
    buildBody: (sys, usr, mt) => ({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: usr },
      ],
      max_tokens: mt,
      temperature: 0.7,
    }),
    extractContent: (data) => data.choices?.[0]?.message?.content ?? '',
  },
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-20241022',
    buildHeaders: (key) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    }),
    buildBody: (sys, usr, mt) => ({
      model: 'claude-3-5-sonnet-20241022',
      system: sys,
      messages: [{ role: 'user', content: usr }],
      max_tokens: mt,
    }),
    extractContent: (data) => data.content?.[0]?.text ?? '',
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    model: 'gemini-pro',
    buildHeaders: (key) => ({
      'Content-Type': 'application/json',
    }),
    buildBody: (sys, usr, mt) => ({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${sys}\n\n${usr}` }],
        },
      ],
      generationConfig: { maxOutputTokens: mt },
    }),
    extractContent: (data) =>
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
  },
  siliconflow: {
    url: 'https://api.siliconflow.cn/v1/chat/completions',
    model: 'Qwen/Qwen3-VL-32B-Instruct',
    buildHeaders: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    }),
    buildBody: (sys, usr, mt) => ({
      model: 'Qwen/Qwen3-VL-32B-Instruct',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: usr },
      ],
      max_tokens: mt,
      temperature: 0.7,
    }),
    extractContent: (data) => data.choices?.[0]?.message?.content ?? '',
  },
};

export interface ContentResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * Send a custom prompt to the current AI provider and get raw text back.
 */
export async function generateContent(
  provider: AIProvider,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 4096,
): Promise<ContentResult> {
  try {
    const apiKey = await apiKeyStore.getAPIKey(provider);
    if (!apiKey) {
      return { success: false, content: '', error: `未找到 ${provider} 的 API 密钥` };
    }

    const config = PROVIDER_CONFIG[provider];

    const url = provider === 'gemini'
      ? `${config.url}?key=${apiKey}`
      : config.url;

    const response = await fetch(url, {
      method: 'POST',
      headers: config.buildHeaders(apiKey),
      body: JSON.stringify(config.buildBody(systemPrompt, userPrompt, maxTokens)),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, content: '', error: `API 请求失败: ${response.status} ${err}` };
    }

    const data = await response.json();
    const content = config.extractContent(data);

    if (!content) {
      return { success: false, content: '', error: 'AI 返回内容为空' };
    }

    return { success: true, content };
  } catch (e) {
    return {
      success: false,
      content: '',
      error: e instanceof Error ? e.message : '未知错误',
    };
  }
}
