/**
 * Warning Message Component
 * 警告消息组件
 * 
 * 显示高风险命令警告
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface WarningMessageProps {
  content: string;
  command?: string;
  messageId: string;
  onExecute: (command: string, messageId: string) => void;
  onCancel: (messageId: string) => void;
}

export const WarningMessage: React.FC<WarningMessageProps> = ({
  content,
  command,
  messageId,
  onExecute,
  onCancel,
}) => {
  const themeColors = useTheme();

  return (
    <View style={styles.container}>
      <View style={[
        styles.bubble,
        { 
          backgroundColor: themeColors.surface,
          borderColor: colors.status.warning,
        }
      ]}>
        <View style={styles.content}>
          <Icon name="warning" size={24} color={colors.status.warning} />
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>
              高风险命令警告
            </Text>
            <Text style={[styles.text, { color: themeColors.textSecondary }]}>
              {content}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => onCancel(messageId)}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={() => {
              if (command) {
                onExecute(command, messageId);
              }
            }}
          >
            <Text style={styles.confirmButtonText}>确认执行</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: 44,
    paddingRight: spacing.sm,
    marginBottom: spacing.lg,
  },
  bubble: {
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    padding: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  text: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#64748B',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
