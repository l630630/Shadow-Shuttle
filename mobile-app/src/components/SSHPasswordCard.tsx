import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../hooks/useTheme';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';

interface SSHPasswordCardProps {
  icon?: string;
  title: string;
  subtitle: string;
  meshIP: string;
  password: string;
  onPasswordChange: (text: string) => void;
  onConnect: () => void;
  onCancel: () => void;
  connecting: boolean;
}

export const SSHPasswordCard: React.FC<SSHPasswordCardProps> = ({
  icon = 'lock-outline',
  title,
  subtitle,
  meshIP,
  password,
  onPasswordChange,
  onConnect,
  onCancel,
  connecting,
}) => {
  const themeColors = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: themeColors.surface }, shadows.lg]}>
        <Icon name={icon} size={48} color={colors.primary} style={styles.icon} />

        <Text style={[styles.title, { color: themeColors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {subtitle}
        </Text>

        <View style={[styles.infoRow, { backgroundColor: themeColors.surfaceDarker }]}>
          <Icon name="person-outline" size={20} color={themeColors.textSecondary} />
          <Text style={[styles.infoText, { color: themeColors.textPrimary }]}>
            用户名: a0000
          </Text>
        </View>

        <View style={[styles.infoRow, { backgroundColor: themeColors.surfaceDarker }]}>
          <Icon name="computer" size={20} color={themeColors.textSecondary} />
          <Text style={[styles.infoText, { color: themeColors.textPrimary }]}>
            主机: {meshIP}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Icon name="vpn-key" size={20} color={themeColors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, {
              backgroundColor: themeColors.background,
              color: themeColors.textPrimary,
              borderColor: themeColors.border,
            }]}
            value={password}
            onChangeText={onPasswordChange}
            placeholder="请输入密码"
            placeholderTextColor={themeColors.textMuted}
            secureTextEntry
            autoFocus
            onSubmitEditing={onConnect}
            editable={!connecting}
          />
        </View>

        {connecting && (
          <View style={styles.connectingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.connectingText, { color: themeColors.textSecondary }]}>
              正在连接...
            </Text>
          </View>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { backgroundColor: themeColors.surfaceDarker }]}
            onPress={onCancel}
            disabled={connecting}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: themeColors.textPrimary }]}>
              取消
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.connectButton,
              { backgroundColor: (!password.trim() || connecting) ? themeColors.textMuted : colors.primary },
              shadows.sm,
            ]}
            onPress={onConnect}
            disabled={!password.trim() || connecting}
            activeOpacity={0.8}
          >
            <Icon name="login" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.connectButtonText}>连接</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.xl + spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
  },
  connectingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  connectingText: {
    fontSize: typography.fontSize.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  cancelButton: {},
  connectButton: {},
  buttonIcon: {},
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
