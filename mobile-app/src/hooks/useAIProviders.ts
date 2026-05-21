/**
 * AI Providers Hook
 * AI 提供商管理 Hook
 * 
 * 管理 AI 提供商的选择、API 密钥保存、验证等逻辑
 */

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getNLController } from '../services/nlController';
import { apiKeyStore } from '../stores/apiKeyStore';
import { AIProvider } from '../types/nlc';

export const useAIProviders = () => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    openai: '',
    claude: '',
    gemini: '',
    siliconflow: '',
  });
  const [maskedKeys, setMaskedKeys] = useState<Record<AIProvider, string | null>>({
    openai: null,
    claude: null,
    gemini: null,
    siliconflow: null,
  });
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [showPassword, setShowPassword] = useState<Record<AIProvider, boolean>>({
    openai: false,
    claude: false,
    gemini: false,
    siliconflow: false,
  });
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [validatingProvider, setValidatingProvider] = useState<AIProvider | null>(null);

  const nlController = getNLController();

  // 加载 API 密钥和当前提供商
  useEffect(() => {
    loadAPIKeys();
    loadCurrentProvider();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const masked: Record<AIProvider, string | null> = {
        openai: await apiKeyStore.getMaskedAPIKey('openai'),
        claude: await apiKeyStore.getMaskedAPIKey('claude'),
        gemini: await apiKeyStore.getMaskedAPIKey('gemini'),
        siliconflow: await apiKeyStore.getMaskedAPIKey('siliconflow'),
      };
      setMaskedKeys(masked);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const loadCurrentProvider = () => {
    const current = nlController.getCurrentProvider();
    setSelectedProvider(current);
  };

  const getProviderName = (provider: AIProvider): string => {
    const names: Record<AIProvider, string> = {
      openai: 'OpenAI',
      claude: 'Claude',
      gemini: 'Google Gemini',
      siliconflow: '硅基流动',
    };
    return names[provider];
  };

  const validateKeyFormat = (provider: AIProvider, key: string): boolean => {
    if (provider === 'openai' && !key.startsWith('sk-')) {
      Alert.alert('格式错误', 'OpenAI API 密钥应以 "sk-" 开头');
      return false;
    }
    if (provider === 'claude' && !key.startsWith('sk-ant-')) {
      Alert.alert('格式错误', 'Claude API 密钥应以 "sk-ant-" 开头');
      return false;
    }
    if (provider === 'gemini') {
      if (!key.startsWith('AIza') && !key.startsWith('sk-')) {
        Alert.alert('格式错误', 'Gemini API 密钥应以 "AIza" 或 "sk-" 开头');
        return false;
      }
    }
    return true;
  };

  const selectProvider = async (provider: AIProvider) => {
    const hasKey = maskedKeys[provider] !== null;

    if (!hasKey) {
      Alert.alert(
        '未配置 API 密钥',
        `请先为 ${getProviderName(provider)} 配置 API 密钥`,
        [{ text: '确定' }]
      );
      return;
    }

    if (selectedProvider === provider) {
      return;
    }

    setValidatingProvider(provider);

    try {
      await nlController.setAIProvider(provider);
      setSelectedProvider(provider);
      await apiKeyStore.setLastSelectedProvider(provider);
      Alert.alert('✓ 切换成功', `已切换到 ${getProviderName(provider)}`);
    } catch (error) {
      console.error('Failed to set AI provider:', error);
      Alert.alert('切换失败', error instanceof Error ? error.message : '无法切换 AI 提供商');
    } finally {
      setValidatingProvider(null);
    }
  };

  const saveAPIKey = async (provider: AIProvider) => {
    const key = apiKeys[provider];

    if (!key || key.trim().length === 0) {
      Alert.alert('错误', '请输入 API 密钥');
      return;
    }

    if (!validateKeyFormat(provider, key)) {
      return;
    }

    setIsSavingKey(true);
    setValidatingProvider(provider);

    try {
      await apiKeyStore.saveAPIKey(provider, key.trim());
      await loadAPIKeys();
      setApiKeys((prev) => ({ ...prev, [provider]: '' }));
      setEditingProvider(null);
      setShowPassword((prev) => ({ ...prev, [provider]: false }));

      Alert.alert('✓ 保存成功', `${getProviderName(provider)} API 密钥已安全保存`);

      if (!selectedProvider) {
        await selectProvider(provider);
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      Alert.alert('保存失败', '无法保存 API 密钥，请重试');
    } finally {
      setIsSavingKey(false);
      setValidatingProvider(null);
    }
  };

  const deleteAPIKey = async (provider: AIProvider) => {
    Alert.alert(
      '删除 API 密钥',
      `确定要删除 ${getProviderName(provider)} 的 API 密钥吗？\n\n删除后将无法使用该 AI 服务。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiKeyStore.deleteAPIKey(provider);
              if (selectedProvider === provider) {
                setSelectedProvider(null);
              }
              await loadAPIKeys();
              Alert.alert('✓ 删除成功', 'API 密钥已删除');
            } catch (error) {
              console.error('Failed to delete API key:', error);
              Alert.alert('删除失败', '无法删除 API 密钥，请重试');
            }
          },
        },
      ]
    );
  };

  const togglePasswordVisibility = (provider: AIProvider) => {
    setShowPassword((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const startEditing = (provider: AIProvider) => {
    setEditingProvider(provider);
    setShowPassword((prev) => ({ ...prev, [provider]: false }));
  };

  const cancelEditing = (provider: AIProvider) => {
    setEditingProvider(null);
    setApiKeys((prev) => ({ ...prev, [provider]: '' }));
    setShowPassword((prev) => ({ ...prev, [provider]: false }));
  };

  const updateAPIKey = (provider: AIProvider, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }));
  };

  return {
    selectedProvider,
    apiKeys,
    maskedKeys,
    editingProvider,
    showPassword,
    isSavingKey,
    validatingProvider,
    selectProvider,
    saveAPIKey,
    deleteAPIKey,
    togglePasswordVisibility,
    startEditing,
    cancelEditing,
    updateAPIKey,
    getProviderName,
  };
};
