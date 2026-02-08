/**
 * API Key Store
 * API 密钥存储
 * 
 * Securely manages AI service API keys using MMKV for encrypted storage.
 * Provides methods to save, retrieve, delete, and mask API keys.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.7
 */

import { MMKV } from 'react-native-mmkv';
import { AIProvider } from '../types/nlc';
import { StorageKeys } from '../config/nlc-constants';

// Initialize MMKV with encryption
const storage = new MMKV({
  id: 'api-keys-storage',
  encryptionKey: 'shadow-shuttle-secure-key-2024', // In production, use a more secure key
});

const LAST_SELECTED_PROVIDER_KEY = 'last_selected_ai_provider';

/**
 * API Key Store Interface
 * API 密钥存储接口
 */
export interface APIKeyStore {
  /**
   * Save API key for a provider
   * 保存 API 密钥
   * @param provider Service provider
   * @param apiKey API key to save
   */
  saveAPIKey(provider: AIProvider, apiKey: string): Promise<void>;

  /**
   * Get API key for a provider
   * 获取 API 密钥
   * @param provider Service provider
   * @returns API key or null if not found
   */
  getAPIKey(provider: AIProvider): Promise<string | null>;

  /**
   * Delete API key for a provider
   * 删除 API 密钥
   * @param provider Service provider
   */
  deleteAPIKey(provider: AIProvider): Promise<void>;

  /**
   * Get configured providers list
   * 获取已配置的提供商列表
   * @returns Array of configured providers
   */
  getConfiguredProviders(): Promise<AIProvider[]>;

  /**
   * Get masked API key for display
   * 获取掩码后的密钥（用于显示）
   * @param provider Service provider
   * @returns Masked API key (e.g., "sk-...xyz") or null if not found
   */
  getMaskedAPIKey(provider: AIProvider): Promise<string | null>;

  /** 获取上次选择的 AI 提供商（持久化） */
  getLastSelectedProvider(): Promise<AIProvider | null>;

  /** 保存上次选择的 AI 提供商 */
  setLastSelectedProvider(provider: AIProvider): Promise<void>;
}

/**
 * API Key Store Implementation
 * API 密钥存储实现
 */
class APIKeyStoreImpl implements APIKeyStore {
  /**
   * Generate storage key for a provider
   * 生成提供商的存储键
   */
  private getStorageKey(provider: AIProvider): string {
    return `${StorageKeys.API_KEY_PREFIX}${provider}`;
  }

  /**
   * Mask an API key for display
   * 掩码 API 密钥用于显示
   * 
   * Shows only the first few and last few characters, hiding the middle part.
   * Example: "sk-proj-abc123def456ghi789" -> "sk-...789"
   * 
   * Requirement 10.3: Display only partial characters (e.g., sk-...xyz)
   */
  private maskAPIKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '***';
    }

    // For OpenAI keys (sk-...), show prefix and last 3 chars
    if (apiKey.startsWith('sk-')) {
      const lastChars = apiKey.slice(-3);
      return `sk-...${lastChars}`;
    }

    // For other keys, show first 4 and last 3 chars
    const firstChars = apiKey.slice(0, 4);
    const lastChars = apiKey.slice(-3);
    return `${firstChars}...${lastChars}`;
  }

  /**
   * Save API key for a provider
   * 保存 API 密钥
   * 
   * Requirement 10.2: Encrypt and store API key in device secure storage
   */
  async saveAPIKey(provider: AIProvider, apiKey: string): Promise<void> {
    try {
      const key = this.getStorageKey(provider);
      storage.set(key, apiKey);
    } catch (error) {
      console.error(`Failed to save API key for ${provider}:`, error);
      throw new Error(`Failed to save API key for ${provider}`);
    }
  }

  /**
   * Get API key for a provider
   * 获取 API 密钥
   * 
   * Requirement 10.2: Decrypt and retrieve API key from secure storage
   */
  async getAPIKey(provider: AIProvider): Promise<string | null> {
    try {
      const key = this.getStorageKey(provider);
      const apiKey = storage.getString(key);
      return apiKey || null;
    } catch (error) {
      console.error(`Failed to get API key for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Delete API key for a provider
   * 删除 API 密钥
   * 
   * Requirement 10.7: Provide option to delete API key
   */
  async deleteAPIKey(provider: AIProvider): Promise<void> {
    try {
      const key = this.getStorageKey(provider);
      storage.delete(key);
    } catch (error) {
      console.error(`Failed to delete API key for ${provider}:`, error);
      throw new Error(`Failed to delete API key for ${provider}`);
    }
  }

  /**
   * Get configured providers list
   * 获取已配置的提供商列表
   * 
   * Checks which providers have API keys stored.
   * 
   * Requirement 10.1: Support first-time setup prompt
   * (This method helps determine if any providers are configured)
   */
  async getConfiguredProviders(): Promise<AIProvider[]> {
    const providers: AIProvider[] = ['openai', 'claude', 'gemini', 'siliconflow'];
    const configured: AIProvider[] = [];

    for (const provider of providers) {
      const apiKey = await this.getAPIKey(provider);
      if (apiKey) {
        configured.push(provider);
      }
    }

    return configured;
  }

  /**
   * Get masked API key for display
   * 获取掩码后的密钥（用于显示）
   * 
   * Requirement 10.3: Display only partial characters (e.g., sk-...xyz)
   */
  async getMaskedAPIKey(provider: AIProvider): Promise<string | null> {
    const apiKey = await this.getAPIKey(provider);
    
    if (apiKey === null) {
      return null;
    }

    return this.maskAPIKey(apiKey);
  }

  async getLastSelectedProvider(): Promise<AIProvider | null> {
    try {
      const value = storage.getString(LAST_SELECTED_PROVIDER_KEY);
      if (!value) return null;
      const valid: AIProvider[] = ['openai', 'claude', 'gemini', 'siliconflow'];
      return valid.includes(value as AIProvider) ? (value as AIProvider) : null;
    } catch {
      return null;
    }
  }

  async setLastSelectedProvider(provider: AIProvider): Promise<void> {
    try {
      storage.set(LAST_SELECTED_PROVIDER_KEY, provider);
    } catch (error) {
      console.error('Failed to save last selected provider:', error);
    }
  }
}

// Export singleton instance
export const apiKeyStore = new APIKeyStoreImpl();

// Export class for testing
export { APIKeyStoreImpl };
