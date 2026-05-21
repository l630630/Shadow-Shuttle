/**
 * Settings Screen
 * 设置界面
 * 
 * Manages app settings including AI provider, API keys, privacy filters,
 * security options, and other preferences.
 * 
 * Requirements: 10.1, 10.3, 10.5, 10.7, 3.6, 4.6, 13.1, 13.5, 9.7
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Header } from '../components/Header';
import { apiKeyStore } from '../stores/apiKeyStore';
import { offlineModeStore } from '../stores/offlineModeStore';
import { AIProvider } from '../types/nlc';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../styles/theme';
import { useTheme } from '../hooks/useTheme';
import { BottomSheetModal } from '../components/BottomSheetModal';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(
    null
  );
  const [apiKeys, setApiKeys] = useState<Record<AIProvider, string>>({
    openai: '',
    claude: '',
    gemini: '',
    siliconflow: '',
  });
  const [maskedKeys, setMaskedKeys] = useState<Record<AIProvider, string>>({
    openai: '',
    claude: '',
    gemini: '',
    siliconflow: '',
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(
    null
  );
  const [newApiKey, setNewApiKey] = useState('');

  // Settings
  const [privacyFilterEnabled, setPrivacyFilterEnabled] = useState(true);
  const [dangerousCommandWarning, setDangerousCommandWarning] = useState(true);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const themeColors = useTheme();

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Load API keys
    const providers: AIProvider[] = ['openai', 'claude', 'gemini', 'siliconflow'];
    const masked: Record<AIProvider, string> = {
      openai: '',
      claude: '',
      gemini: '',
      siliconflow: '',
    };

    for (const provider of providers) {
      const key = await apiKeyStore.getMaskedAPIKey(provider);
      if (key) {
        masked[provider] = key;
      }
    }

    setMaskedKeys(masked);

    // Load selected provider from storage
    // TODO: Implement provider selection persistence
    const configuredProviders = await apiKeyStore.getConfiguredProviders();
    if (configuredProviders.length > 0) {
      // 优先使用硅基流动，如果已配置的话
      if (configuredProviders.includes('siliconflow')) {
        setSelectedProvider('siliconflow');
      } else {
        setSelectedProvider(configuredProviders[0]);
      }
    }

    // Load offline mode state
    const isOffline = offlineModeStore.isOffline();
    setOfflineMode(isOffline);
  };

  const handleSaveApiKey = async () => {
    if (!editingProvider || !newApiKey.trim()) {
      Alert.alert('错误', '请输入有效的 API 密钥');
      return;
    }

    try {
      await apiKeyStore.saveAPIKey(editingProvider, newApiKey.trim());
      
      // Update masked key display
      const masked = await apiKeyStore.getMaskedAPIKey(editingProvider);
      setMaskedKeys(prev => ({
        ...prev,
        [editingProvider]: masked || '',
      }));

      // If this is the first API key, set it as selected provider
      if (!selectedProvider) {
        setSelectedProvider(editingProvider);
      }

      setNewApiKey('');
      setEditingProvider(null);
      setShowApiKeyModal(false);

      Alert.alert('成功', 'API 密钥已保存');
    } catch (error) {
      Alert.alert(
        '保存失败',
        error instanceof Error ? error.message : '未知错误'
      );
    }
  };

  const handleDeleteApiKey = async (provider: AIProvider) => {
    Alert.alert(
      '删除 API 密钥',
      `确定要删除 ${getProviderName(provider)} 的 API 密钥吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiKeyStore.deleteAPIKey(provider);
              setMaskedKeys(prev => ({
                ...prev,
                [provider]: '',
              }));

              // If deleted provider was selected, clear selection
              if (selectedProvider === provider) {
                const configuredProviders =
                  await apiKeyStore.getConfiguredProviders();
                // 优先使用硅基流动
                if (configuredProviders.includes('siliconflow')) {
                  setSelectedProvider('siliconflow');
                } else {
                  setSelectedProvider(
                    configuredProviders.length > 0 ? configuredProviders[0] : null
                  );
                }
              }

              Alert.alert('成功', 'API 密钥已删除');
            } catch (error) {
              Alert.alert(
                '删除失败',
                error instanceof Error ? error.message : '未知错误'
              );
            }
          },
        },
      ]
    );
  };

  const getProviderName = (provider: AIProvider): string => {
    switch (provider) {
      case 'openai':
        return 'OpenAI GPT-4';
      case 'claude':
        return 'Claude 3.5 Sonnet';
      case 'gemini':
        return 'Google Gemini';
      case 'siliconflow':
        return '硅基流动';
      default:
        return provider;
    }
  };

  const getProviderIcon = (provider: AIProvider): string => {
    switch (provider) {
      case 'openai':
        return 'psychology';
      case 'claude':
        return 'smart-toy';
      case 'gemini':
        return 'auto-awesome';
      case 'siliconflow':
        return 'memory';
      default:
        return 'api';
    }
  };

  const renderProviderCard = (provider: AIProvider) => {
    const isConfigured = !!maskedKeys[provider];
    const isSelected = selectedProvider === provider;

    return (
      <TouchableOpacity
        key={provider}
        style={[
          styles.providerCard,
          {
            backgroundColor: themeColors.surface,
            borderColor: isSelected ? colors.primary : themeColors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => {
          if (isConfigured) {
            setSelectedProvider(provider);
          } else {
            Alert.alert(
              '未配置',
              `请先配置 ${getProviderName(provider)} 的 API 密钥`,
              [{ text: '确定' }]
            );
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.providerHeader}>
          <View style={styles.providerInfo}>
            <Icon
              name={getProviderIcon(provider)}
              size={24}
              color={isSelected ? colors.primary : themeColors.textSecondary}
            />
            <Text
              style={[
                styles.providerName,
                {
                  color: isSelected
                    ? colors.primary
                    : themeColors.textPrimary,
                },
              ]}
            >
              {getProviderName(provider)}
            </Text>
          </View>
          {isSelected && (
            <Icon name="check-circle" size={20} color={colors.primary} />
          )}
        </View>

        {isConfigured ? (
          <View style={styles.providerActions}>
            <Text
              style={[styles.maskedKey, { color: themeColors.textSecondary }]}
            >
              {maskedKeys[provider]}
            </Text>
            <View style={styles.providerButtons}>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { backgroundColor: themeColors.background },
                ]}
                onPress={() => {
                  setEditingProvider(provider);
                  setShowApiKeyModal(true);
                }}
              >
                <Icon name="edit" size={16} color={themeColors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { backgroundColor: themeColors.background },
                ]}
                onPress={() => handleDeleteApiKey(provider)}
              >
                <Icon
                  name="delete-outline"
                  size={16}
                  color={colors.status.error}
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setEditingProvider(provider);
              setShowApiKeyModal(true);
            }}
          >
            <Icon name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>添加 API 密钥</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderApiKeyModal = () => (
    <BottomSheetModal
      visible={showApiKeyModal}
      onClose={() => setShowApiKeyModal(false)}
      title={editingProvider
        ? `配置 ${getProviderName(editingProvider)}`
        : '配置 API 密钥'}
      footer={
        <>
          <TouchableOpacity
            style={[
              styles.modalButton,
              { backgroundColor: themeColors.background },
            ]}
            onPress={() => {
              setNewApiKey('');
              setShowApiKeyModal(false);
            }}
          >
            <Text
              style={[
                styles.modalButtonText,
                { color: themeColors.textPrimary },
              ]}
            >
              取消
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.modalButtonPrimary,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleSaveApiKey}
          >
            <Icon
              name="check"
              size={20}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
              保存
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text
        style={[styles.inputLabel, { color: themeColors.textSecondary }]}
      >
        API 密钥
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: themeColors.background,
            color: themeColors.textPrimary,
            borderColor: themeColors.border,
          },
        ]}
        placeholder="输入 API 密钥"
        placeholderTextColor={themeColors.textMuted}
        value={newApiKey}
        onChangeText={setNewApiKey}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text
        style={[styles.helpText, { color: themeColors.textMuted }]}
      >
        API 密钥将被安全加密存储在设备上
      </Text>
    </BottomSheetModal>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <Header
        title="设置"
        subtitle="配置 AI 服务和偏好"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* AI Provider Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            AI 服务提供商
          </Text>
          <Text
            style={[styles.sectionDescription, { color: themeColors.textSecondary }]}
          >
            选择用于自然语言解析的 AI 服务
          </Text>

          {(['openai', 'claude', 'gemini', 'siliconflow'] as AIProvider[]).map(
            renderProviderCard
          )}
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            隐私与安全
          </Text>

          <View
            style={[styles.settingRow, { backgroundColor: themeColors.surface }]}
          >
            <View style={styles.settingInfo}>
              <Text
                style={[styles.settingTitle, { color: themeColors.textPrimary }]}
              >
                隐私过滤
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: themeColors.textSecondary },
                ]}
              >
                自动过滤敏感信息（路径、IP、密码）
              </Text>
            </View>
            <Switch
              value={privacyFilterEnabled}
              onValueChange={setPrivacyFilterEnabled}
              trackColor={{ false: themeColors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View
            style={[styles.settingRow, { backgroundColor: themeColors.surface }]}
          >
            <View style={styles.settingInfo}>
              <Text
                style={[styles.settingTitle, { color: themeColors.textPrimary }]}
              >
                危险命令警告
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: themeColors.textSecondary },
                ]}
              >
                执行危险命令前需要二次确认
              </Text>
            </View>
            <Switch
              value={dangerousCommandWarning}
              onValueChange={setDangerousCommandWarning}
              trackColor={{ false: themeColors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            输入方式
          </Text>

          <View
            style={[styles.settingRow, { backgroundColor: themeColors.surface }]}
          >
            <View style={styles.settingInfo}>
              <Text
                style={[styles.settingTitle, { color: themeColors.textPrimary }]}
              >
                语音输入
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: themeColors.textSecondary },
                ]}
              >
                启用语音识别功能
              </Text>
            </View>
            <Switch
              value={voiceInputEnabled}
              onValueChange={setVoiceInputEnabled}
              trackColor={{ false: themeColors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Network Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            网络
          </Text>

          <View
            style={[styles.settingRow, { backgroundColor: themeColors.surface }]}
          >
            <View style={styles.settingInfo}>
              <Text
                style={[styles.settingTitle, { color: themeColors.textPrimary }]}
              >
                离线模式
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: themeColors.textSecondary },
                ]}
              >
                禁用 AI 解析，仅使用本地功能
              </Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={value => {
                setOfflineMode(value);
                if (value) {
                  offlineModeStore.setOffline();
                } else {
                  offlineModeStore.setOnline();
                }
              }}
              trackColor={{ false: themeColors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
            关于
          </Text>

          <View
            style={[styles.settingRow, { backgroundColor: themeColors.surface }]}
          >
            <Text
              style={[styles.settingTitle, { color: themeColors.textPrimary }]}
            >
              版本
            </Text>
            <Text
              style={[styles.settingValue, { color: themeColors.textSecondary }]}
            >
              0.2.0
            </Text>
          </View>
        </View>
      </ScrollView>

      {renderApiKeyModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  providerCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  providerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  providerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maskedKey: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
    flex: 1,
  },
  providerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
  },
  settingValue: {
    fontSize: typography.fontSize.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  modalBody: {
    padding: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.sm,
  },
  helpText: {
    fontSize: typography.fontSize.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  modalButtonPrimary: {
    ...shadows.md,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
