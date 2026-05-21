/**
 * Chat Bubble Component
 * 消息气泡组件
 * 
 * 基于 shadow-shuttle 的设计风格
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Message } from '../types/nlc';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { useTheme } from '../hooks/useTheme';

interface ChatBubbleProps {
  message: Message;
  onExecuteCommand?: (command: string, messageId: string) => void;
  onCancelCommand?: (messageId: string) => void;
  onAgentStop?: (messageId: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onExecuteCommand,
  onCancelCommand,
  onAgentStop,
}) => {
  const themeColors = useTheme();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const isUser = message.role === 'user';
  const hasCommand = message.metadata?.command;
  const isDangerous = message.metadata?.isDangerous;
  const isConfirmed = message.metadata?.isConfirmed;

  // Command Preview Type
  if (message.type === 'command') {
    return (
      <View style={styles.commandPreviewContainer}>
        <View style={[
          styles.commandPreview,
          { 
            backgroundColor: themeColors.surfaceDarker,
            borderColor: themeColors.border,
          }
        ]}>
          {/* Header */}
          <View style={[
            styles.commandHeader,
            { 
              backgroundColor: isDarkMode ? '#1a2130' : '#F5F5F5',
              borderBottomColor: themeColors.border,
            }
          ]}>
            <View style={styles.commandHeaderLeft}>
              <Icon name="terminal" size={16} color={themeColors.textMuted} />
              <Text style={[styles.commandLabel, { color: themeColors.textMuted }]}>
                命令预览
              </Text>
            </View>
            <View style={styles.commandDots}>
              <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
              <View style={[styles.dot, { backgroundColor: '#FFC107' }]} />
              <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
            </View>
          </View>

          {/* Command */}
          <View style={styles.commandBody}>
            <Text style={[styles.commandPrompt, { color: colors.status.success }]}>
              root@device:~#
            </Text>
            <Text style={[styles.commandText, { color: themeColors.textPrimary }]}>
              {message.content}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Warning Type
  if (message.type === 'warning') {
    return (
      <View style={styles.warningContainer}>
        <View style={[
          styles.warningBubble,
          { 
            backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.1)' : '#FFF3E0',
            borderColor: colors.status.warning,
          }
        ]}>
          <View style={styles.warningContent}>
            <Icon name="warning" size={24} color={colors.status.warning} />
            <View style={styles.warningTextContainer}>
              <Text style={[styles.warningTitle, { color: themeColors.textPrimary }]}>
                高风险命令警告
              </Text>
              <Text style={[styles.warningText, { color: themeColors.textSecondary }]}>
                {message.content}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.warningActions}>
            <TouchableOpacity
              style={[styles.warningButton, styles.cancelButton]}
              onPress={() => onCancelCommand?.(message.id)}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.warningButton, styles.confirmButton]}
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
  }

  // Agent Plan Type
  if (message.type === 'agent_plan') {
    const plan = message.metadata?.agentPlan;
    const stepResults = message.metadata?.stepResults || [];
    const currentIndex = message.metadata?.currentStepIndex ?? -1;
    const status = message.metadata?.agentStatus || 'planning';
    const totalSteps = plan?.steps?.length || 0;
    const completedSteps = stepResults.length;

    const statusLabel: Record<string, string> = {
      planning: '规划中',
      executing: '执行中',
      waiting_confirmation: '等待确认',
      completed: '已完成',
      aborted: '已中止',
    };

    const riskColor: Record<string, string> = {
      low: colors.status.success,
      medium: colors.status.warning,
      high: '#FF6B35',
      critical: colors.status.error,
    };

    return (
      <View style={styles.agentPlanContainer}>
        <View style={[styles.agentPlanCard, { backgroundColor: themeColors.surfaceDarker, borderColor: themeColors.border }]}>
          {/* 标题栏 */}
          <View style={[styles.agentPlanHeader, { borderBottomColor: themeColors.border }]}>
            <View style={styles.agentPlanHeaderLeft}>
              <Icon name="auto-awesome" size={18} color={colors.primary} />
              <Text style={[styles.agentPlanTitle, { color: themeColors.textPrimary }]}>
                AI 执行计划
              </Text>
              {totalSteps > 0 && (
                <Text style={[styles.agentPlanProgress, { color: themeColors.textMuted }]}>
                  ({completedSteps}/{totalSteps})
                </Text>
              )}
            </View>
            <View style={styles.agentPlanHeaderRight}>
              <View style={[styles.statusBadge, { backgroundColor: status === 'executing' ? colors.primary + '20' : themeColors.surface }]}>
                <Text style={[styles.statusText, { color: status === 'executing' ? colors.primary : themeColors.textMuted }]}>
                  {statusLabel[status] || status}
                </Text>
              </View>
              {status === 'executing' && onAgentStop && (
                <TouchableOpacity
                  style={styles.agentStopButton}
                  onPress={() => onAgentStop(message.id)}
                >
                  <Icon name="stop-circle" size={20} color={colors.status.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* AI 思考过程 */}
          {plan?.thought && (
            <View style={styles.agentThought}>
              <Text style={[styles.agentThoughtText, { color: themeColors.textSecondary }]}>
                {plan.thought}
              </Text>
            </View>
          )}

          {/* 步骤列表 */}
          {plan?.steps?.map((step, idx) => {
            const result = stepResults.find(r => r.stepId === step.id);
            const isDone = !!result;
            const isActive = idx === currentIndex && !isDone;
            const isPending = !isDone && !isActive;
            const stepFailed = result && !result.success;

            return (
              <View key={step.id} style={[styles.agentStep, { borderBottomColor: themeColors.border }]}>
                {/* 步骤头部 */}
                <View style={styles.agentStepHeader}>
                  <View style={styles.agentStepIndicator}>
                    {isDone && !stepFailed && (
                      <Icon name="check-circle" size={18} color={colors.status.success} />
                    )}
                    {isDone && stepFailed && (
                      <Icon name="cancel" size={18} color={colors.status.error} />
                    )}
                    {isActive && (
                      <View style={styles.agentStepSpinner}>
                        <Icon name="autorenew" size={18} color={colors.primary} />
                      </View>
                    )}
                    {isPending && (
                      <Icon name="radio-button-unchecked" size={18} color={themeColors.textMuted} />
                    )}
                  </View>
                  <View style={styles.agentStepInfo}>
                    <Text style={[
                      styles.agentStepExplanation,
                      { color: isPending ? themeColors.textMuted : themeColors.textPrimary }
                    ]}>
                      {step.explanation}
                    </Text>
                    <View style={styles.agentStepMeta}>
                      <Text style={[styles.agentStepCommand, { color: themeColors.textMuted }]}>
                        $ {step.command}
                      </Text>
                      <View style={[styles.riskBadge, { backgroundColor: riskColor[step.riskLevel] + '20' }]}>
                        <Text style={[styles.riskBadgeText, { color: riskColor[step.riskLevel] }]}>
                          {step.riskLevel}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 步骤输出 */}
                {isDone && result && result.output && (
                  <View style={[styles.agentStepOutput, { backgroundColor: isDarkMode ? '#0d1117' : '#F5F5F5' }]}>
                    <Text style={[styles.agentStepOutputText, { color: stepFailed ? colors.status.error : themeColors.textSecondary }]} numberOfLines={6}>
                      {result.output}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* 完成摘要 */}
          {plan?.summary && status === 'completed' && (
            <View style={[styles.agentSummary, { borderTopColor: themeColors.border }]}>
              <Icon name="task-alt" size={18} color={colors.status.success} />
              <Text style={[styles.agentSummaryText, { color: themeColors.textPrimary }]}>
                {plan.summary}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Standard Text Message
  return (
    <View style={[
      styles.messageContainer,
      isUser ? styles.userMessageContainer : styles.aiMessageContainer,
    ]}>
      {/* AI Avatar */}
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Icon name="smart-toy" size={18} color="#FFFFFF" />
        </View>
      )}

      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.aiBubble,
        { 
          backgroundColor: isUser 
            ? colors.primary 
            : themeColors.surface,
          borderColor: isUser ? 'transparent' : themeColors.border,
        }
      ]}>
        {/* Image if present */}
        {message.image && (
          <View style={styles.imageContainer}>
            {/* Image would be rendered here */}
            <Text style={[styles.imageText, { color: themeColors.textMuted }]}>
              [图片]
            </Text>
          </View>
        )}

        {/* Message Text */}
        <Text style={[
          styles.messageText,
          { 
            color: isUser ? '#FFFFFF' : themeColors.textPrimary,
            fontFamily: message.type && ['command', 'warning'].includes(message.type)
              ? typography.fontFamily.mono 
              : undefined,
          }
        ]}>
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
              backgroundColor: isDarkMode ? '#111722' : '#F5F5F5',
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
        <Text style={[
          styles.timestamp,
          { color: isUser ? 'rgba(255, 255, 255, 0.7)' : themeColors.textMuted }
        ]}>
          {isUser ? '你' : '影梭 AI'} • {message.timestamp.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* User Avatar */}
      {isUser && (
        <View style={styles.userAvatar}>
          <Icon name="person" size={18} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Message Container
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },

  // Avatars
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Message Bubble
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  aiBubble: {
    borderTopLeftRadius: 4,
  },

  // Message Text
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: 20,
  },

  // Image
  imageContainer: {
    marginBottom: spacing.sm,
  },
  imageText: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },

  // Inline Command
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

  // Command Actions
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

  // Dangerous Warning
  dangerousWarning: {
    fontSize: typography.fontSize.xs,
    color: colors.status.error,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
  },

  // Auto-execute indicator
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

  // Timestamp
  timestamp: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },

  // Command Preview
  commandPreviewContainer: {
    paddingLeft: 44,
    paddingRight: spacing.sm,
    marginBottom: spacing.lg,
  },
  commandPreview: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  commandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  commandHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  commandLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  commandDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  commandBody: {
    padding: spacing.lg,
  },
  commandPrompt: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  commandText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono,
  },

  // Warning
  warningContainer: {
    paddingLeft: 44,
    paddingRight: spacing.sm,
    marginBottom: spacing.lg,
  },
  warningBubble: {
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    padding: spacing.lg,
  },
  warningContent: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  warningActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  warningButton: {
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

  // Agent Plan
  agentPlanContainer: {
    paddingLeft: 44,
    paddingRight: spacing.sm,
    marginBottom: spacing.lg,
  },
  agentPlanCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  agentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  agentPlanHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  agentPlanTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  agentPlanProgress: {
    fontSize: typography.fontSize.xs,
  },
  agentPlanHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  agentStopButton: {
    padding: 2,
  },
  agentThought: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  agentThoughtText: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  agentStep: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
  },
  agentStepHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  agentStepIndicator: {
    width: 22,
    alignItems: 'center',
    paddingTop: 2,
  },
  agentStepSpinner: {
    // 可加旋转动画
  },
  agentStepInfo: {
    flex: 1,
  },
  agentStepExplanation: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  agentStepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  agentStepCommand: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 4,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  agentStepOutput: {
    marginTop: spacing.xs,
    marginLeft: 30,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  agentStepOutputText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
    lineHeight: 18,
  },
  agentSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  agentSummaryText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
});

export default ChatBubble;
