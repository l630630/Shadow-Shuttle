/**
 * Agent Plan Card Component
 * AI 执行计划卡片组件
 * 
 * Displays AI agent execution plan with steps, progress, and results.
 * 显示 AI 代理执行计划，包含步骤、进度和结果。
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Message } from '../../types/nlc';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * Agent Plan Card Props
 */
interface AgentPlanCardProps {
  message: Message;
  onAgentStop?: (messageId: string) => void;
}

/**
 * Status labels mapping
 */
const STATUS_LABELS: Record<string, string> = {
  planning: '规划中',
  executing: '执行中',
  waiting_confirmation: '等待确认',
  completed: '已完成',
  aborted: '已中止',
};

/**
 * Risk level colors mapping
 */
const RISK_COLORS: Record<string, string> = {
  low: colors.status.success,
  medium: colors.status.warning,
  high: '#FF6B35',
  critical: colors.status.error,
};

/**
 * Agent Plan Card Component
 * AI 执行计划卡片组件
 */
export const AgentPlanCard: React.FC<AgentPlanCardProps> = ({
  message,
  onAgentStop,
}) => {
  const themeColors = useTheme();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const plan = message.metadata?.agentPlan;
  const stepResults = message.metadata?.stepResults || [];
  const currentIndex = message.metadata?.currentStepIndex ?? -1;
  const status = message.metadata?.agentStatus || 'planning';
  const totalSteps = plan?.steps?.length || 0;
  const completedSteps = stepResults.length;

  return (
    <View style={styles.container}>
      <View style={[
        styles.card,
        { 
          backgroundColor: themeColors.surfaceDarker,
          borderColor: themeColors.border,
        }
      ]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <View style={styles.headerLeft}>
            <Icon name="auto-awesome" size={18} color={colors.primary} />
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>
              AI 执行计划
            </Text>
            {totalSteps > 0 && (
              <Text style={[styles.progress, { color: themeColors.textMuted }]}>
                ({completedSteps}/{totalSteps})
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: status === 'executing' ? colors.primary + '20' : themeColors.surface }
            ]}>
              <Text style={[
                styles.statusText,
                { color: status === 'executing' ? colors.primary : themeColors.textMuted }
              ]}>
                {STATUS_LABELS[status] || status}
              </Text>
            </View>
            {status === 'executing' && onAgentStop && (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={() => onAgentStop(message.id)}
              >
                <Icon name="stop-circle" size={20} color={colors.status.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* AI Thought */}
        {plan?.thought && (
          <View style={styles.thought}>
            <Text style={[styles.thoughtText, { color: themeColors.textSecondary }]}>
              {plan.thought}
            </Text>
          </View>
        )}

        {/* Steps */}
        {plan?.steps?.map((step, idx) => {
          const result = stepResults.find(r => r.stepId === step.id);
          const isDone = !!result;
          const isActive = idx === currentIndex && !isDone;
          const isPending = !isDone && !isActive;
          const stepFailed = result && !result.success;

          return (
            <View key={step.id} style={[styles.step, { borderBottomColor: themeColors.border }]}>
              {/* Step Header */}
              <View style={styles.stepHeader}>
                <View style={styles.stepIndicator}>
                  {isDone && !stepFailed && (
                    <Icon name="check-circle" size={18} color={colors.status.success} />
                  )}
                  {isDone && stepFailed && (
                    <Icon name="cancel" size={18} color={colors.status.error} />
                  )}
                  {isActive && (
                    <View style={styles.stepSpinner}>
                      <Icon name="autorenew" size={18} color={colors.primary} />
                    </View>
                  )}
                  {isPending && (
                    <Icon name="radio-button-unchecked" size={18} color={themeColors.textMuted} />
                  )}
                </View>
                <View style={styles.stepInfo}>
                  <Text style={[
                    styles.stepExplanation,
                    { color: isPending ? themeColors.textMuted : themeColors.textPrimary }
                  ]}>
                    {step.explanation}
                  </Text>
                  <View style={styles.stepMeta}>
                    <Text style={[styles.stepCommand, { color: themeColors.textMuted }]}>
                      $ {step.command}
                    </Text>
                    <View style={[
                      styles.riskBadge,
                      { backgroundColor: RISK_COLORS[step.riskLevel] + '20' }
                    ]}>
                      <Text style={[
                        styles.riskBadgeText,
                        { color: RISK_COLORS[step.riskLevel] }
                      ]}>
                        {step.riskLevel}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Step Output */}
              {isDone && result && result.output && (
                <View style={[
                  styles.stepOutput,
                  { backgroundColor: isDarkMode ? '#0d1117' : '#F5F5F5' }
                ]}>
                  <Text style={[
                    styles.stepOutputText,
                    { color: stepFailed ? colors.status.error : themeColors.textSecondary }
                  ]} numberOfLines={6}>
                    {result.output}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Summary */}
        {plan?.summary && status === 'completed' && (
          <View style={[styles.summary, { borderTopColor: themeColors.border }]}>
            <Icon name="task-alt" size={18} color={colors.status.success} />
            <Text style={[styles.summaryText, { color: themeColors.textPrimary }]}>
              {plan.summary}
            </Text>
          </View>
        )}
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
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  progress: {
    fontSize: typography.fontSize.xs,
  },
  headerRight: {
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
  stopButton: {
    padding: 2,
  },
  thought: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  thoughtText: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  step: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
  },
  stepHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepIndicator: {
    width: 22,
    alignItems: 'center',
    paddingTop: 2,
  },
  stepSpinner: {
    // 可加旋转动画
  },
  stepInfo: {
    flex: 1,
  },
  stepExplanation: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepCommand: {
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
  stepOutput: {
    marginTop: spacing.xs,
    marginLeft: 30,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  stepOutputText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.mono,
    lineHeight: 18,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
});
