/**
 * Add Device Modal
 * 添加设备模态框 - 支持手动输入和扫码两种方式
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius, shadows, getThemeColors } from '../styles/theme';

interface AddDeviceModalProps {
  visible: boolean;
  onClose: () => void;
  onManualAdd: (ip: string, port: string, username: string, password: string) => Promise<void>;
  onScanQR: () => void;
}

type AddMode = 'select' | 'manual';

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  visible,
  onClose,
  onManualAdd,
  onScanQR,
}) => {
  // 默认直接进入「手动输入」模式，避免用户额外多点一步
  const [mode, setMode] = useState<AddMode>('manual');
  const [loading, setLoading] = useState(false);
  
  // Manual input fields
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isDarkMode = true;
  const themeColors = getThemeColors(isDarkMode);

  const handleClose = () => {
    // 关闭时重置为手动模式（下次打开仍然直接显示表单）
    setMode('manual');
    setIp('');
    setPort('22');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  const handleManualSubmit = async () => {
    if (!ip.trim()) {
      Alert.alert('错误', '请输入 IP 地址');
      return;
    }
    if (!port.trim()) {
      Alert.alert('错误', '请输入端口号');
      return;
    }
    if (!username.trim()) {
      Alert.alert('错误', '请输入用户名');
      return;
    }
    if (!password.trim()) {
      Alert.alert('错误', '请输入密码');
      return;
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      Alert.alert('错误', '请输入有效的 IP 地址');
      return;
    }

    // Validate port
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      Alert.alert('错误', '请输入有效的端口号 (1-65535)');
      return;
    }

    setLoading(true);
    try {
      await onManualAdd(ip, port, username, password);
      handleClose();
    } catch (error) {
      Alert.alert('添加失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    handleClose();
    onScanQR();
  };

  // Render mode selection
  const renderModeSelection = () => (
    <View style={styles.modeSelection}>
      <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
        添加设备
      </Text>
      <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
        选择添加方式
      </Text>

      {/* Scan QR Code Option */}
      <TouchableOpacity
        style={[styles.modeCard, { backgroundColor: themeColors.surface }]}
        onPress={handleScanQR}
        activeOpacity={0.7}
      >
        <View style={[styles.modeIcon, { backgroundColor: `${colors.primary}20` }]}>
          <Icon name="qr-code-scanner" size={32} color={colors.primary} />
        </View>
        <View style={styles.modeContent}>
          <Text style={[styles.modeTitle, { color: themeColors.textPrimary }]}>
            扫描二维码
          </Text>
          <Text style={[styles.modeDescription, { color: themeColors.textSecondary }]}>
            快速安全，推荐使用
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color={themeColors.textSecondary} />
      </TouchableOpacity>

      {/* Manual Input Option */}
      <TouchableOpacity
        style={[styles.modeCard, { backgroundColor: themeColors.surface }]}
        onPress={() => setMode('manual')}
        activeOpacity={0.7}
      >
        <View style={[styles.modeIcon, { backgroundColor: '#9C27B020' }]}>
          <Icon name="edit" size={32} color="#9C27B0" />
        </View>
        <View style={styles.modeContent}>
          <Text style={[styles.modeTitle, { color: themeColors.textPrimary }]}>
            手动输入
          </Text>
          <Text style={[styles.modeDescription, { color: themeColors.textSecondary }]}>
            输入 IP 地址和密码
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color={themeColors.textSecondary} />
      </TouchableOpacity>

      {/* Info Box */}
      <View style={[styles.infoBox, { backgroundColor: `${colors.primary}10` }]}>
        <Icon name="info-outline" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.primary }]}>
          扫码方式需要在目标设备上运行 shadowd-generate-qr 命令
        </Text>
      </View>
    </View>
  );

  // Render manual input form
  const renderManualInput = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.manualInput}
    >
      <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <View style={styles.manualHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMode('select')}
          >
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.manualHeaderText}>
            <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
              手动添加设备
            </Text>
            <Text style={[styles.modalSubtitle, { color: themeColors.textSecondary }]}>
              输入设备连接信息
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* IP Address */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              IP 地址 *
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: themeColors.surfaceDarker }]}>
              <Icon name="computer" size={20} color={themeColors.textSecondary} />
              <TextInput
                style={[styles.input, { color: themeColors.textPrimary }]}
                value={ip}
                onChangeText={setIp}
                placeholder="例如: 192.168.1.100"
                placeholderTextColor={themeColors.textMuted}
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Port */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              SSH 端口 *
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: themeColors.surfaceDarker }]}>
              <Icon name="settings-ethernet" size={20} color={themeColors.textSecondary} />
              <TextInput
                style={[styles.input, { color: themeColors.textPrimary }]}
                value={port}
                onChangeText={setPort}
                placeholder="默认: 22"
                placeholderTextColor={themeColors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              用户名 *
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: themeColors.surfaceDarker }]}>
              <Icon name="person" size={20} color={themeColors.textSecondary} />
              <TextInput
                style={[styles.input, { color: themeColors.textPrimary }]}
                value={username}
                onChangeText={setUsername}
                placeholder="例如: root"
                placeholderTextColor={themeColors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              密码 *
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: themeColors.surfaceDarker }]}>
              <Icon name="lock" size={20} color={themeColors.textSecondary} />
              <TextInput
                style={[styles.input, { color: themeColors.textPrimary }]}
                value={password}
                onChangeText={setPassword}
                placeholder="输入 SSH 密码"
                placeholderTextColor={themeColors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Icon
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Warning */}
          <View style={[styles.warningBox, { backgroundColor: `${colors.status.warning}20` }]}>
            <Icon name="warning" size={20} color={colors.status.warning} />
            <Text style={[styles.warningText, { color: colors.status.warning }]}>
              密码将被安全加密存储，仅用于 SSH 连接
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleManualSubmit}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="add" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>添加设备</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: themeColors.background }]}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Icon name="close" size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>

          {/* Content */}
          {mode === 'select' ? renderModeSelection() : renderManualInput()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '90%',
    minHeight: Math.min(Dimensions.get('window').height * 0.6, 500),
    paddingBottom: spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Mode Selection
  modeSelection: {
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xl,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    ...shadows.sm,
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: typography.fontSize.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },

  // Manual Input（不用 flex:1，避免在无高度父容器里被算成 0）
  manualInput: {
    minHeight: 400,
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualHeaderText: {
    flex: 1,
  },
  form: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing.md,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
