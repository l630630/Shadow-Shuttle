/**
 * Login Screen
 * Based on shadow-shuttle web design
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../stores/authStore';
import { colors, typography, spacing, borderRadius, shadows, getThemeColors } from '../styles/theme';
import { Logo } from '../components/Logo';

export const LoginScreen: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, register, loading } = useAuthStore();
  const isDarkMode = true;
  const themeColors = getThemeColors(isDarkMode);

  const handleLogin = async () => {
    try {
      await login(username, password);
    } catch (error) {
      Alert.alert('登录失败', error instanceof Error ? error.message : '未知错误');
    }
  };

  const handleRegister = async () => {
    try {
      await register(username, email, password);
    } catch (error) {
      Alert.alert('注册失败', error instanceof Error ? error.message : '未知错误');
    }
  };

  const handleSubmit = () => {
    if (authMode === 'login') {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <View style={[styles.backgroundBlob1, { backgroundColor: `${colors.primary}33` }]} />
        <View style={[styles.backgroundBlob2, { backgroundColor: '#9C27B033' }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Title */}
        <View style={styles.header}>
          {/* Logo Container - 使用 Logo 组件 */}
          <Logo size={80} showGlow={true} />
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            SHADOW<Text style={[styles.titleAccent, { color: colors.primary }]}>SHUTTLE</Text>
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Next-Gen Server Management Mesh
          </Text>
        </View>

        {/* Form Card */}
        <View style={[styles.formCard, { backgroundColor: `${themeColors.surface}CC` }]}>
          {authMode === 'login' ? (
            <>
              {/* Username Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                  身份 ID
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: themeColors.surfaceDarker }]}>
                  <Icon name="person" size={20} color={themeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: themeColors.textPrimary }]}
                    placeholder="输入用户名"
                    placeholderTextColor={themeColors.textMuted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                  访问密钥
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: themeColors.surfaceDarker }]}>
                  <Icon name="vpn-key" size={20} color={themeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: themeColors.textPrimary }]}
                    placeholder="输入密码"
                    placeholderTextColor={themeColors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Icon
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={themeColors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>建立安全连接</Text>
                )}
              </TouchableOpacity>

              {/* Switch to Register */}
              <View style={styles.switchModeContainer}>
                <Text style={[styles.switchModeText, { color: themeColors.textSecondary }]}>
                  还没有账号？{' '}
                </Text>
                <TouchableOpacity onPress={() => setAuthMode('register')}>
                  <Text style={[styles.switchModeLink, { color: colors.primary }]}>
                    立即注册
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Username Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                  设置身份 ID
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: themeColors.surfaceDarker }]}>
                  <Icon name="person" size={20} color={themeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: themeColors.textPrimary }]}
                    placeholder="设置用户名"
                    placeholderTextColor={themeColors.textMuted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                  安全邮箱
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: themeColors.surfaceDarker }]}>
                  <Icon name="email" size={20} color={themeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: themeColors.textPrimary }]}
                    placeholder="email@example.com"
                    placeholderTextColor={themeColors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                  设置密钥
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: themeColors.surfaceDarker }]}>
                  <Icon name="vpn-key" size={20} color={themeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: themeColors.textPrimary }]}
                    placeholder="设置密码"
                    placeholderTextColor={themeColors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Icon
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={themeColors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.success }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>初始化身份 (注册)</Text>
                )}
              </TouchableOpacity>

              {/* Switch to Login */}
              <View style={styles.switchModeContainer}>
                <Text style={[styles.switchModeText, { color: themeColors.textSecondary }]}>
                  已有账号？{' '}
                </Text>
                <TouchableOpacity onPress={() => setAuthMode('login')}>
                  <Text style={[styles.switchModeLink, { color: colors.primary }]}>
                    返回登录
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: themeColors.textMuted }]}>
          v1.0.0 • 端对端加密
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  backgroundBlob1: {
    position: 'absolute',
    top: '-20%',
    left: '-20%',
    width: '70%',
    height: '70%',
    borderRadius: 9999,
    opacity: 0.2,
  },
  backgroundBlob2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-20%',
    width: '70%',
    height: '70%',
    borderRadius: 9999,
    opacity: 0.2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoWrapper: {
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,  // size-20 = 80px
    height: 80,
    borderRadius: borderRadius.xl,  // rounded-2xl
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',  // border-white/10
    // shadow-2xl shadow-primary/20
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: typography.fontSize['3xl'],  // text-3xl
    fontWeight: typography.fontWeight.black,  // font-black
    letterSpacing: -1,  // tracking-tighter
    marginBottom: spacing.sm,
    fontStyle: 'italic',  // italic (SHADOW 部分)
  },
  titleAccent: {
    fontWeight: typography.fontWeight.bold,
    fontStyle: 'normal',  // not-italic (SHUTTLE 部分)
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
  },
  formCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...shadows.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: spacing.sm,
  },
  submitButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.lg,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  switchModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  switchModeText: {
    fontSize: typography.fontSize.xs,
  },
  switchModeLink: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  footer: {
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xl,
  },
});
