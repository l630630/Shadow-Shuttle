/**
 * Profile Screen - 一比一还原 shadow-shuttle web 版
 * 包含主视图和三个子视图：系统设置、账户信息、安全中心
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../stores/authStore';
import { useDeviceStore } from '../stores/deviceStore';
import { apiKeyStore } from '../stores/apiKeyStore';
import { getNLController } from '../services/nlController';
import { AIProvider } from '../types/nlc';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { useTheme } from '../hooks/useTheme';
import { profileScreenStyles as styles } from '../styles/profileScreen.styles';
import { Logo } from '../components/Logo';

type ProfileView = 'main' | 'app_settings' | 'account' | 'security';

interface Session {
  id: number;
  device: string;
  location: string;
  isCurrent: boolean;
  icon: string;
  time: string;
}

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [profileView, setProfileView] = useState<ProfileView>('main');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Settings state
  const [privacyShieldEnabled, setPrivacyShieldEnabled] = useState(true);
  const [dataAnonymization, setDataAnonymization] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  
  // AI Settings state
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
  
  // Load API keys and current provider on mount
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

  // Handle AI provider selection
  const handleSelectProvider = async (provider: AIProvider) => {
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

  // Handle save API key
  const handleSaveAPIKey = async (provider: AIProvider) => {
    const key = apiKeys[provider];
    
    if (!key || key.trim().length === 0) {
      Alert.alert('错误', '请输入 API 密钥');
      return;
    }

    // Format validation
    if (provider === 'openai' && !key.startsWith('sk-')) {
      Alert.alert('格式错误', 'OpenAI API 密钥应以 "sk-" 开头');
      return;
    }
    if (provider === 'claude' && !key.startsWith('sk-ant-')) {
      Alert.alert('格式错误', 'Claude API 密钥应以 "sk-ant-" 开头');
      return;
    }
    if (provider === 'gemini') {
      // Gemini 支持两种格式：
      // 1. Google 官方 API: 以 "AIza" 开头
      // 2. 第三方代理（OpenAI 兼容）: 以 "sk-" 开头
      if (!key.startsWith('AIza') && !key.startsWith('sk-')) {
        Alert.alert('格式错误', 'Gemini API 密钥应以 "AIza" 或 "sk-" 开头');
        return;
      }
    }

    setIsSavingKey(true);
    setValidatingProvider(provider);
    
    try {
      await apiKeyStore.saveAPIKey(provider, key.trim());
      await loadAPIKeys();
      setApiKeys(prev => ({ ...prev, [provider]: '' }));
      setEditingProvider(null);
      setShowPassword(prev => ({ ...prev, [provider]: false }));
      
      Alert.alert('✓ 保存成功', `${getProviderName(provider)} API 密钥已安全保存`);
      
      if (!selectedProvider) {
        await handleSelectProvider(provider);
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      Alert.alert('保存失败', '无法保存 API 密钥，请重试');
    } finally {
      setIsSavingKey(false);
      setValidatingProvider(null);
    }
  };

  // Handle delete API key
  const handleDeleteAPIKey = async (provider: AIProvider) => {
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

  // Helper function to get provider name
  const getProviderName = (provider: AIProvider): string => {
    const names: Record<AIProvider, string> = {
      openai: 'OpenAI',
      claude: 'Claude',
      gemini: 'Google Gemini',
      siliconflow: '硅基流动',
    };
    return names[provider];
  };

  // Toggle password visibility
  const togglePasswordVisibility = (provider: AIProvider) => {
    setShowPassword(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  // Cancel editing
  const handleCancelEdit = (provider: AIProvider) => {
    setEditingProvider(null);
    setApiKeys(prev => ({ ...prev, [provider]: '' }));
    setShowPassword(prev => ({ ...prev, [provider]: false }));
  };
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  
  // Sessions
  const [sessions, setSessions] = useState<Session[]>([
    { id: 1, device: 'Chrome on macOS', location: 'Shenzhen', isCurrent: true, icon: 'computer', time: '当前设备' },
    { id: 2, device: 'Shadow Shuttle App', location: 'Shanghai', isCurrent: false, icon: 'smartphone', time: '2小时前' },
    { id: 3, device: 'Firefox on Windows', location: 'Beijing', isCurrent: false, icon: 'laptop', time: '1天前' },
  ]);
  
  // Account form
  const [email, setEmail] = useState('admin@shadowshuttle.io');
  const [bio, setBio] = useState('Senior Systems Architect.');
  
  const themeColors = useTheme();
  const { logout, username } = useAuthStore();
  const { devices } = useDeviceStore();

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？本地数据将会保留。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            setTimeout(async () => {
              try {
                await logout();
                setIsLoggingOut(false);
              } catch (error) {
                console.error('Logout error:', error);
                setIsLoggingOut(false);
                Alert.alert('错误', '退出登录失败，请重试');
              }
            }, 1500);
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.new || passwordForm.new !== passwordForm.confirm) {
      return;
    }
    
    setPasswordStatus('saving');
    setTimeout(() => {
      setPasswordStatus('success');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordStatus('idle');
        setPasswordForm({ current: '', new: '', confirm: '' });
        Alert.alert('成功', '密码已修改');
      }, 1000);
    }, 1500);
  };

  const handleKickSession = (id: number) => {
    Alert.alert(
      '踢出会话',
      '确定要踢出这个会话吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '踢出',
          style: 'destructive',
          onPress: () => {
            setSessions(prev => prev.filter(s => s.id !== id));
          },
        },
      ]
    );
  };

  const handleSaveAccount = () => {
    Alert.alert('成功', '账户信息已保存');
    setProfileView('main');
  };

  // 渲染主视图
  const renderMainView = () => (
    <ScrollView style={styles.mainView} showsVerticalScrollIndicator={false}>
      {/* Header - 匹配 web 版样式 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
          个人中心
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* User Card */}
      <View style={[styles.userCard, { backgroundColor: themeColors.surface }]}>
        {/* Decorative blob */}
        <View style={styles.userCardBlob} />
        
        <View style={styles.userCardContent}>
          {/* Avatar - 使用 Logo 组件 */}
          <View style={styles.avatarContainer}>
            <Logo size={64} showGlow={false} />
            <View style={styles.onlineIndicator} />
          </View>
          
          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: themeColors.textPrimary }]}>
              {username || 'SysAdmin'}
            </Text>
            <View style={styles.badge}>
              <Icon name="verified-user" size={12} color={colors.primary} />
              <Text style={styles.badgeText}>Root Access</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: themeColors.textPrimary }]}>
              {devices.length}
            </Text>
            <Text style={styles.statLabel}>节点</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>99%</Text>
            <Text style={styles.statLabel}>在线率</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>A+</Text>
            <Text style={styles.statLabel}>健康度</Text>
          </View>
        </View>
      </View>

      {/* Menu Section */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>功能与设置</Text>
        
        {/* System Settings */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: themeColors.surface }]}
          onPress={() => setProfileView('app_settings')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}1A` }]}>
            <Icon name="tune" size={24} color={colors.primary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: themeColors.textPrimary }]}>
              系统设置
            </Text>
            <Text style={[styles.menuSubtitle, { color: themeColors.textSecondary }]}>
              隐私, AI 模型, 凭证
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={themeColors.textSecondary} />
        </TouchableOpacity>

        {/* Account Info */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: themeColors.surface }]}
          onPress={() => setProfileView('account')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#9C27B01A' }]}>
            <Icon name="person" size={24} color="#9C27B0" />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: themeColors.textPrimary }]}>
              账户信息
            </Text>
            <Text style={[styles.menuSubtitle, { color: themeColors.textSecondary }]}>
              个人资料与身份
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={themeColors.textSecondary} />
        </TouchableOpacity>

        {/* Security Center */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: themeColors.surface }]}
          onPress={() => setProfileView('security')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: `${colors.success}1A` }]}>
            <Icon name="security" size={24} color={colors.success} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: themeColors.textPrimary }]}>
              安全中心
            </Text>
            <Text style={[styles.menuSubtitle, { color: themeColors.textSecondary }]}>
              密码, 2FA, 会话
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutButtonText}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // 渲染系统设置子视图
  const renderAppSettingsView = () => {
    // Render AI Provider Card
    const renderAIProvider = (
      provider: AIProvider,
      name: string,
      description: string,
      icon: string,
      color: string,
      placeholder: string
    ) => {
      const isSelected = selectedProvider === provider;
      const hasKey = maskedKeys[provider] !== null;
      const isEditing = editingProvider === provider;
      const isValidating = validatingProvider === provider;
      const isPasswordVisible = showPassword[provider];

      return (
        <View
          key={provider}
          style={[
            isSelected ? styles.aiProviderActive : styles.aiProviderInactive,
            { backgroundColor: isSelected ? `${color}1A` : themeColors.surfaceDarker },
            isSelected && { borderColor: `${color}80`, borderWidth: 2 },
          ]}
        >
          {/* Provider Header */}
          <TouchableOpacity
            style={styles.aiProviderHeader}
            onPress={() => handleSelectProvider(provider)}
            activeOpacity={0.7}
            disabled={!hasKey || isValidating}
          >
            {isSelected && !isValidating && (
              <View style={[styles.aiProviderActiveBadge, { backgroundColor: color }]}>
                <Text style={styles.aiProviderActiveBadgeText}>已激活</Text>
              </View>
            )}
            
            <View style={[
              styles.aiProviderIcon,
              { backgroundColor: isSelected ? color : 'rgba(255,255,255,0.05)' }
            ]}>
              <Icon name={icon} size={24} color={isSelected ? "#FFFFFF" : themeColors.textSecondary} />
            </View>
            
            <View style={styles.aiProviderContent}>
              <View style={styles.aiProviderTitleRow}>
                <Text style={[styles.aiProviderTitle, { color: isSelected ? themeColors.textPrimary : '#CBD5E1' }]}>
                  {name}
                </Text>
                {isSelected && !isValidating && (
                  <Icon name="verified" size={14} color={color} />
                )}
                {isValidating && (
                  <ActivityIndicator size="small" color={color} />
                )}
              </View>
              <Text style={[styles.aiProviderDesc, { color: isSelected ? themeColors.textSecondary : '#64748B' }]}>
                {description}
              </Text>
            </View>
            
            {!isValidating && (
              <View style={isSelected ? styles.aiProviderRadioActive : styles.aiProviderRadioInactive} />
            )}
          </TouchableOpacity>

          {/* API Key Section */}
          {hasKey && !isEditing ? (
            // Show masked key
            <View style={styles.aiKeySection}>
              <View style={[styles.aiKeyDisplay, { backgroundColor: themeColors.background }]}>
                <Icon name="vpn-key" size={16} color={themeColors.textSecondary} />
                <Text style={[styles.aiKeyText, { color: themeColors.textSecondary }]}>
                  {maskedKeys[provider]}
                </Text>
                <View style={[styles.aiKeyValidBadge, { backgroundColor: `${colors.success}1A` }]}>
                  <Icon name="check-circle" size={12} color={colors.success} />
                  <Text style={[styles.aiKeyValidText, { color: colors.success }]}>有效</Text>
                </View>
              </View>
              
              <View style={styles.aiKeyActions}>
                <TouchableOpacity
                  style={styles.aiKeyActionButton}
                  onPress={() => {
                    setEditingProvider(provider);
                    setShowPassword(prev => ({ ...prev, [provider]: false }));
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="edit" size={16} color={themeColors.textSecondary} />
                  <Text style={[styles.aiKeyActionText, { color: themeColors.textSecondary }]}>更新</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.aiKeyActionButton}
                  onPress={() => handleDeleteAPIKey(provider)}
                  activeOpacity={0.7}
                >
                  <Icon name="delete" size={16} color={colors.error} />
                  <Text style={[styles.aiKeyActionText, { color: colors.error }]}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Show input for new/edit key
            <View style={styles.aiKeySection}>
              <View style={[styles.aiKeyInput, { backgroundColor: themeColors.background }]}>
                <Icon name="vpn-key" size={16} color={themeColors.textSecondary} />
                <TextInput
                  style={[styles.aiKeyTextInput, { color: themeColors.textPrimary }]}
                  value={apiKeys[provider]}
                  onChangeText={(text) => setApiKeys(prev => ({ ...prev, [provider]: text }))}
                  placeholder={placeholder}
                  placeholderTextColor={themeColors.textMuted}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={isEditing}
                  editable={true}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (apiKeys[provider]) {
                      handleSaveAPIKey(provider);
                    }
                  }}
                />
                <TouchableOpacity
                  style={styles.aiKeyEyeButton}
                  onPress={() => togglePasswordVisibility(provider)}
                  activeOpacity={0.7}
                >
                  <Icon 
                    name={isPasswordVisible ? 'visibility' : 'visibility-off'} 
                    size={20} 
                    color={themeColors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.aiKeyActions}>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.aiKeyActionButton}
                    onPress={() => handleCancelEdit(provider)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.aiKeyActionText, { color: themeColors.textSecondary }]}>取消</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.aiKeySaveButton,
                    { backgroundColor: color },
                    (!apiKeys[provider] || isSavingKey) && { opacity: 0.5 },
                  ]}
                  onPress={() => handleSaveAPIKey(provider)}
                  disabled={!apiKeys[provider] || isSavingKey}
                  activeOpacity={0.8}
                >
                  {isSavingKey && validatingProvider === provider ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="save" size={16} color="#FFFFFF" />
                      <Text style={styles.aiKeySaveText}>保存</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.aiKeyHint}>
                <Icon name="info-outline" size={14} color={themeColors.textMuted} />
                <Text style={[styles.aiKeyHintText, { color: themeColors.textMuted }]}>
                  密钥通过 MMKV 加密存储
                </Text>
              </View>
            </View>
          )}
        </View>
      );
    };

    return (
    <ScrollView 
      style={styles.subViewContent} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {/* Privacy Shield Card */}
      <View style={[styles.privacyShieldCard, { backgroundColor: themeColors.surface }]}>
        <View style={styles.privacyShieldLeft}>
          <View style={styles.privacyShieldHeader}>
            <Icon name="security" size={20} color={colors.primary} />
            <Text style={[styles.privacyShieldTitle, { color: themeColors.textPrimary }]}>
              隐私护盾
            </Text>
          </View>
          <Text style={[styles.privacyShieldDesc, { color: themeColors.textSecondary }]}>
            通过主动 Mesh 加密保护您的身份。
          </Text>
          <View style={styles.privacyShieldToggle}>
            <Switch
              value={privacyShieldEnabled}
              onValueChange={setPrivacyShieldEnabled}
              trackColor={{ false: '#232f48', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
            <Text style={styles.privacyShieldStatus}>已激活</Text>
          </View>
        </View>
        <View style={styles.privacyShieldRight}>
          <View style={styles.privacyShieldImageOverlay} />
          <Icon name="security" size={48} color="rgba(255,255,255,0.5)" />
        </View>
      </View>

      {/* Controls */}
      <View style={styles.settingsSection}>
        <Text style={[styles.settingsSectionTitle, { color: themeColors.textPrimary }]}>
          控制选项
        </Text>
        <View style={[styles.controlsList, { backgroundColor: themeColors.surfaceDarker }]}>
          <View style={[styles.controlItem, { borderBottomColor: 'rgba(100,116,139,0.5)' }]}>
            <View style={styles.controlItemLeft}>
              <Text style={[styles.controlItemTitle, { color: themeColors.textPrimary }]}>
                本地数据脱敏
              </Text>
              <Text style={[styles.controlItemDesc, { color: themeColors.textSecondary }]}>
                发送前匿名化个人敏感信息
              </Text>
            </View>
            <Switch
              value={dataAnonymization}
              onValueChange={setDataAnonymization}
              trackColor={{ false: '#232f48', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <TouchableOpacity style={styles.controlItem}>
            <View style={styles.controlItemLeft}>
              <Text style={[styles.controlItemTitle, { color: themeColors.textPrimary }]}>
                日志保留
              </Text>
              <Text style={[styles.controlItemDesc, { color: themeColors.textSecondary }]}>
                自动清除本地日志
              </Text>
            </View>
            <View style={styles.controlItemRight}>
              <Text style={[styles.controlItemValue, { color: themeColors.textSecondary }]}>
                30 天
              </Text>
              <Icon name="chevron-right" size={20} color={themeColors.textSecondary} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlItem, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('VPNSettings')}
            activeOpacity={0.7}
          >
            <View style={styles.controlItemLeft}>
              <Text style={[styles.controlItemTitle, { color: themeColors.textPrimary }]}>
                VPN 设置
              </Text>
              <Text style={[styles.controlItemDesc, { color: themeColors.textSecondary }]}>
                Headscale / WireGuard 连接与 Mesh IP
              </Text>
            </View>
            <View style={styles.controlItemRight}>
              <Icon name="chevron-right" size={20} color={themeColors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Providers */}
      <View style={styles.settingsSection}>
        <View style={styles.aiProvidersHeader}>
          <Text style={[styles.settingsSectionTitle, { color: themeColors.textPrimary }]}>
            AI 服务商
          </Text>
          {(maskedKeys.openai || maskedKeys.claude || maskedKeys.gemini || maskedKeys.siliconflow) && (
            <View style={styles.aiConnectedBadge}>
              <View style={styles.aiConnectedDot} />
              <Text style={styles.aiConnectedText}>已连接</Text>
            </View>
          )}
        </View>
        
        {/* OpenAI Provider */}
        {renderAIProvider('openai', 'OpenAI', 'GPT-4 (经由安全隧道)', 'smart-toy', colors.primary, 'sk-...')}
        
        {/* Claude Provider */}
        {renderAIProvider('claude', 'Claude', 'Claude 3.5 Sonnet', 'psychology', '#9C27B0', 'sk-ant-...')}
        
        {/* Gemini Provider */}
        {renderAIProvider('gemini', 'Google Gemini', 'Gemini Pro', 'auto-awesome', '#4285F4', 'AIza...')}
        
        {/* SiliconFlow Provider */}
        {renderAIProvider('siliconflow', '硅基流动', 'Qwen3-VL-32B-Instruct', 'star', '#FF6B35', 'sk-...')}
      </View>

      <View style={styles.versionFooter}>
        <Text style={styles.versionText}>Shadow Shuttle v2.4.0</Text>
      </View>
    </ScrollView>
    );
  };

  // 渲染账户信息子视图
  const renderAccountView = () => (
    <ScrollView style={styles.subViewContent} showsVerticalScrollIndicator={false}>
      <View style={styles.accountForm}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>用户名 (不可更改)</Text>
          <View style={[styles.formInputContainer, { backgroundColor: themeColors.surfaceDarker }]}>
            <TextInput
              style={[styles.formInput, { color: themeColors.textSecondary }]}
              value={username || 'SysAdmin'}
              editable={false}
            />
            <Icon name="lock" size={16} color="#475569" style={styles.formInputIcon} />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>邮箱</Text>
          <TextInput
            style={[styles.formInputContainer, styles.formInput, { 
              backgroundColor: themeColors.surfaceDarker,
              color: themeColors.textPrimary 
            }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>简介</Text>
          <TextInput
            style={[styles.formInputContainer, styles.formTextArea, { 
              backgroundColor: themeColors.surfaceDarker,
              color: themeColors.textPrimary 
            }]}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveAccount}
        >
          <Text style={styles.saveButtonText}>保存更改</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // 渲染安全中心子视图
  const renderSecurityView = () => (
    <ScrollView style={styles.subViewContent} showsVerticalScrollIndicator={false}>
      {/* 2FA Toggle */}
      <View style={[styles.securityItem, { backgroundColor: themeColors.surfaceDarker }]}>
        <View style={styles.securityItemLeft}>
          <View style={[
            styles.securityItemIcon,
            { backgroundColor: is2FAEnabled ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)' }
          ]}>
            <Icon 
              name="verified-user" 
              size={18} 
              color={is2FAEnabled ? colors.success : themeColors.textSecondary} 
            />
          </View>
          <View>
            <Text style={[styles.securityItemTitle, { color: themeColors.textPrimary }]}>
              两步验证
            </Text>
            <Text style={styles.securityItemDesc}>
              {is2FAEnabled ? '已启用 Authenticator' : '建议开启以保护账户'}
            </Text>
          </View>
        </View>
        <Switch
          value={is2FAEnabled}
          onValueChange={setIs2FAEnabled}
          trackColor={{ false: '#475569', true: colors.success }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Change Password */}
      <TouchableOpacity
        style={[styles.securityItem, { backgroundColor: themeColors.surfaceDarker }]}
        onPress={() => setIsChangePasswordOpen(true)}
      >
        <View style={styles.securityItemLeft}>
          <View style={[styles.securityItemIcon, { backgroundColor: 'rgba(100,116,139,0.2)' }]}>
            <Icon name="lock-reset" size={18} color={themeColors.textSecondary} />
          </View>
          <View>
            <Text style={[styles.securityItemTitle, { color: themeColors.textPrimary }]}>
              修改密码
            </Text>
            <Text style={styles.securityItemDesc}>上次修改: 30天前</Text>
          </View>
        </View>
        <Icon name="chevron-right" size={18} color={themeColors.textSecondary} />
      </TouchableOpacity>

      {/* Active Sessions */}
      <View style={styles.sessionsSection}>
        <Text style={styles.sessionsSectionTitle}>活跃会话</Text>
        {sessions.map(session => (
          <View
            key={session.id}
            style={[
              styles.sessionItem,
              session.isCurrent && styles.sessionItemCurrent
            ]}
          >
            <Icon name={session.icon} size={20} color={themeColors.textSecondary} />
            <View style={styles.sessionInfo}>
              <Text style={[
                styles.sessionDevice,
                { color: session.isCurrent ? themeColors.textPrimary : '#CBD5E1' }
              ]}>
                {session.device}
              </Text>
              <Text style={[
                styles.sessionLocation,
                { color: session.isCurrent ? colors.success : themeColors.textSecondary }
              ]}>
                {session.isCurrent ? `当前设备 • ${session.location}` : `${session.time} • ${session.location}`}
              </Text>
            </View>
            {!session.isCurrent && (
              <TouchableOpacity
                style={styles.sessionKickButton}
                onPress={() => handleKickSession(session.id)}
              >
                <Text style={styles.sessionKickText}>踢出</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {sessions.length === 1 && (
          <View style={styles.sessionsEmpty}>
            <Text style={styles.sessionsEmptyText}>没有其他活跃会话</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // 渲染子视图头部
  const renderSubViewHeader = () => {
    const titles = {
      app_settings: '系统设置',
      account: '账户信息',
      security: '安全中心',
    };

    return (
      <View style={[styles.subViewHeader, { backgroundColor: themeColors.surfaceDarker }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setProfileView('main')}
        >
          <Icon name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.subViewTitle, { color: themeColors.textPrimary }]}>
          {titles[profileView as keyof typeof titles]}
        </Text>
        <View style={styles.backButton} />
      </View>
    );
  };

  // 由于代码太长，我会继续在下一个文件中添加子视图的渲染函数
  // 这里先返回主视图
  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Loading Overlay */}
      {isLoggingOut && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textPrimary }]}>
            正在安全登出...
          </Text>
        </View>
      )}

      {/* Password Change Modal */}
      <Modal
        visible={isChangePasswordOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsChangePasswordOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsChangePasswordOpen(false)}
        >
          <TouchableOpacity
            style={[styles.modalContent, { backgroundColor: themeColors.surface }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
              修改密码
            </Text>
            
            <View style={styles.modalForm}>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>当前密码</Text>
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: themeColors.surfaceDarker,
                    color: themeColors.textPrimary 
                  }]}
                  value={passwordForm.current}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, current: text })}
                  secureTextEntry
                  placeholder="输入当前密码"
                  placeholderTextColor={themeColors.textMuted}
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>新密码</Text>
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: themeColors.surfaceDarker,
                    color: themeColors.textPrimary 
                  }]}
                  value={passwordForm.new}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, new: text })}
                  secureTextEntry
                  placeholder="输入新密码"
                  placeholderTextColor={themeColors.textMuted}
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>确认新密码</Text>
                <TextInput
                  style={[styles.modalInput, { 
                    backgroundColor: themeColors.surfaceDarker,
                    color: themeColors.textPrimary,
                    borderColor: passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm 
                      ? colors.error 
                      : '#475569'
                  }]}
                  value={passwordForm.confirm}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, confirm: text })}
                  secureTextEntry
                  placeholder="再次输入新密码"
                  placeholderTextColor={themeColors.textMuted}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setIsChangePasswordOpen(false)}
              >
                <Text style={styles.modalButtonCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSave,
                  { backgroundColor: colors.primary },
                  (!passwordForm.current || !passwordForm.new || passwordForm.new !== passwordForm.confirm) && 
                  styles.modalButtonDisabled
                ]}
                onPress={handleChangePassword}
                disabled={!passwordForm.current || !passwordForm.new || passwordForm.new !== passwordForm.confirm || passwordStatus === 'saving'}
              >
                {passwordStatus === 'saving' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonSaveText}>
                    {passwordStatus === 'success' ? '成功' : '保存'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Main View */}
      {profileView === 'main' && renderMainView()}

      {/* Sub Views */}
      {profileView !== 'main' && (
        <View style={styles.subViewContainer}>
          {renderSubViewHeader()}
          {profileView === 'app_settings' && renderAppSettingsView()}
          {profileView === 'account' && renderAccountView()}
          {profileView === 'security' && renderSecurityView()}
        </View>
      )}
    </View>
  );
};
