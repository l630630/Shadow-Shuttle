/**
 * Assistant Bubble Component
 * AI 助手消息气泡组件
 * 
 * Displays AI assistant messages with avatar, command preview, and action buttons.
 * 显示 AI 助手消息，包含头像、命令预览和操作按钮。
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Message } from '../../types/nlc';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * Assistant Bubble Props
 */
interface AssistantBubbleProps {
  message: Message;
  onExecuteCommand?: (command: string, messageId: string) => void;
  onCancelCommand?: (messageId: string) => void;
}

/**
 * Assistant Bubble Component
 * AI 助手消息气泡组件
 */
export const AssistantBubble: React.FC<AssistantBubbleProps> = ({
  message,
  onExecuteCommand,
  onCancelCommand,
}) => {
  const themeColors = useTheme();
  const hasCommand = message.metadata?.command;
  const isDangerous = message.metadata?.isDangerous;
  const isConfirmed = message.metadata?.isConfirmed;

  return (
    <View style={styles.container}>
      {/* AI Avatar */}
      <View style={styles.avatar}>
        <Icon name="smart-toy" size={18} color="#FFFFFF" />
      </View>

      <View style={[
        styles.bubble,
        { 
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        }
      ]}>
        {/* Image if present */}
        {message.image && (
          <View style={styles.imageContainer}>
            <Text style={[styles.imageText, { color: themeColors.textMuted }]}>
              [图片]
            </Text>
          </View>
        )}

        {/* Message Text */}
        <Text style={[styles.messageText, { color: themeColors.textPrimary }]}>
          {message.content}
        </Text>

        {/* Auto-execute indicator for safe commands */}
        {hasCommand && !isConfirmed && !message.metadata?.requiresConfirmation && (
          <View style={[styles.autoExecuteIndicator, { backgroundColor: colors.status.success + '20' }]}>
            <Icon name="check-circle" size={16} color={colors.status.success} />
            <Text style={[styles.autoExecuteText, { color: colors.status.success }]}>
              安全命令，自动执行中...
            </Text>
          </View>
        )}

        {/* Command Preview (inline) */}
        {hasCommand && !isConfirmed && message.metadata?.requiresConfirmation && (
          <View style={[
            styles.inlineCommand,
            { 
              backgroundColor: themeColors.surfaceDarker,
              borderLeftColor: isDangerous ? colors.status.error : colors.primary,
            }
          ]}>
            <Text style={[styles.inlineCommandLabel, { color: themeColors.textMuted }]}>
              命令:
            </Text>
            <Text style={[styles.inlineCommandText, { color: themeColors.textPrimary }]}>
              {message.metadata?.command}
            </Text>

            {/* Command Actions */}
            <View style={styles.commandActions}>
              <TouchableOpacity
                style={[styles.commandButton, styles.executeButton]}
                onPress={() => onExecuteCommand?.(message.metadata!.command!, message.id)}
              >
                <Text style={styles.commandButtonText}>执行</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.commandButton, styles.cancelCommandButton]}
                onPress={() => onCancelCommand?.(message.id)}
              >
                <Text style={styles.commandButtonText}>取消</Text>
              </TouchableOpacity>
            </View>

            {isDangerous && (
              <Text style={styles.dangerousWarning}>
                ⚠️ 危险命令，请谨慎执行
              </Text>
            )}
          </View>
        )}

        {/* Timestamp */}
        <Text style={[styles.timestamp, { color: themeColors.textMuted }]}>
          影梭 AI • {message.timestamp.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  imageContainer: {
    marginBottom: spacing.sm,
  },
  imageText: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: 20,
  },
  autoExecuteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  autoExecuteText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  inlineCommand: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
  },
  inlineCommandLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  inlineCommandText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono,
    marginBottom: spacing.sm,
  },
  commandActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  commandButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  executeButton: {
    backgroundColor: colors.status.success,
  },
  cancelCommandButton: {
    backgroundColor: '#9E9E9E',
  },
  commandButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  dangerousWarning: {
    fontSize: typography.fontSize.xs,
    color: colors.status.error,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});
