/**
 * History Detail Modal Component
 * 历史详情模态框组件
 * 
 * Displays detailed information about a command history entry.
 * 显示命令历史记录的详细信息。
 * 
 * Requirements: 6.3
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetModal } from '../BottomSheetModal';
import { HistoryEntry } from '../../types/nlc';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * History Detail Modal Props
 */
interface HistoryDetailModalProps {
  visible: boolean;
  entry: HistoryEntry | null;
  deviceName: string;
  onClose: () => void;
  onReExecute: () => void;
}

/**
 * History Detail Modal Component
 * 历史详情模态框组件
 * 
 * Requirement 6.3: View command details
 */
export const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({
  visible,
  entry,
  deviceName,
  onClose,
  onReExecute,
}) => {
  const themeColors = useTheme();

  if (!entry) return null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="命令详情"
      footer={
        <>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, shadows.sm]}
            onPress={onReExecute}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>重新执行</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.surfaceDarker }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: themeColors.textPrimary }]}>
              关闭
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      {/* Device */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: themeColors.textSecondary }]}>设备</Text>
        <Text style={[styles.value, { color: themeColors.textPrimary }]}>
          {deviceName}
        </Text>
      </View>

      {/* Timestamp */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: themeColors.textSecondary }]}>时间</Text>
        <Text style={[styles.value, { color: themeColors.textPrimary }]}>
          {new Date(entry.timestamp).toLocaleString('zh-CN')}
        </Text>
      </View>

      {/* User Input */}
      {entry.userInput && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.textSecondary }]}>用户输入</Text>
          <Text style={[styles.value, { color: themeColors.textPrimary }]}>
            {entry.userInput}
          </Text>
        </View>
      )}

      {/* Command */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: themeColors.textSecondary }]}>命令</Text>
        <View style={[styles.codeBlock, { backgroundColor: themeColors.surfaceDarker }]}>
          <Text style={[styles.codeText, { color: themeColors.textPrimary }]}>
            {entry.parsedCommand}
          </Text>
        </View>
      </View>

      {/* Output */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: themeColors.textSecondary }]}>输出</Text>
        <ScrollView style={[styles.outputBlock, { backgroundColor: themeColors.surfaceDarker }]}>
          <Text style={[styles.outputText, { color: themeColors.textPrimary }]}>
            {entry.output || '(无输出)'}
          </Text>
        </ScrollView>
      </View>

      {/* Status */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: themeColors.textSecondary }]}>状态</Text>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: entry.exitCode === 0 ? colors.status.success + '20' : colors.status.error + '20' },
          ]}>
            <Text style={[
              styles.statusText,
              { color: entry.exitCode === 0 ? colors.status.success : colors.status.error }
            ]}>
              退出码: {entry.exitCode}
            </Text>
          </View>
          <Text style={[styles.executionTime, { color: themeColors.textMuted }]}>
            执行时间: {entry.executionTime}ms
          </Text>
        </View>
      </View>

      {/* Dangerous Warning */}
      {entry.isDangerous && (
        <View style={[styles.warningSection, { backgroundColor: colors.status.warning + '20' }]}>
          <Text style={[styles.warningText, { color: colors.status.warning }]}>
            ⚠️ 此命令被标记为危险命令
          </Text>
        </View>
      )}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.fontSize.sm,
  },
  codeBlock: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  codeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
  },
  outputBlock: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: 200,
  },
  outputText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'monospace',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  executionTime: {
    fontSize: typography.fontSize.xs,
  },
  warningSection: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
