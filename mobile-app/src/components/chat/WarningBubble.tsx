/**
 * Warning Bubble Component
 * 警告消息气泡组件
 * 
 * Displays warning messages for dangerous commands with confirmation actions.
 * 显示危险命令的警告消息，带有确认操作。
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Message } from '../../types/nlc';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * Warning Bubble Props
 */
interface WarningBubbleProps {
  message: Message;
  onExecuteCommand?: (command: string, messageId: string) => void;
  onCancelCommand?: (messageId: string) => void;
}

/**
 * Warning Bubble Component
 * 警告消息气泡组件
 */
export const WarningBubble: React.FC<WarningBubbleProps> = ({
  message,
  onExecuteCommand,
  onCancelCommand,
}) => {
  const themeColors = useTheme();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <View style={[
        styles.bubble,
        { 
          backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.1)' : '#FFF3E0',
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
              {message.content}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: themeColors.border }]}
            onPress={() => onCancelCommand?.(message.id)}
          >
            <Text style={[styles.cancelButtonText, { color: themeColors.textSecondary }]}>
              取消
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={() => {
              if (message.metadata?.command) {
                onExecuteCommand?.(message.metadata.command, message.id);
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
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
});
