/**
 * History Item Component
 * 历史记录项组件
 * 
 * Displays a single command history entry with status, device, and timing information.
 * 显示单个命令历史记录，包含状态、设备和时间信息。
 * 
 * Requirements: 6.2, 6.3, 6.4
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { HistoryEntry } from '../../types/nlc';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * History Item Props
 */
interface HistoryItemProps {
  entry: HistoryEntry;
  deviceName: string;
  onPress: () => void;
  onLongPress: () => void;
}

/**
 * Format timestamp to relative time
 * 格式化时间戳为相对时间
 */
const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * History Item Component
 * 历史记录项组件
 * 
 * Requirement 6.2: Display history entry
 * Requirement 6.3: Click to view details
 * Requirement 6.4: Long press to show action menu
 */
export const HistoryItem: React.FC<HistoryItemProps> = ({
  entry,
  deviceName,
  onPress,
  onLongPress,
}) => {
  const themeColors = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: themeColors.surface,
          borderColor: entry.isDangerous ? colors.status.error : themeColors.border,
        },
        entry.isDangerous && styles.dangerousBorder,
        shadows.sm,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Header: Device and Timestamp */}
      <View style={styles.header}>
        <View style={styles.deviceRow}>
          <Icon name="computer" size={16} color={themeColors.textSecondary} />
          <Text style={[styles.deviceName, { color: themeColors.textPrimary }]}>
            {deviceName}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: themeColors.textMuted }]}>
          {formatTimestamp(new Date(entry.timestamp))}
        </Text>
      </View>

      {/* User Input */}
      {entry.userInput && (
        <Text style={[styles.userInput, { color: themeColors.textSecondary }]} numberOfLines={1}>
          {entry.userInput}
        </Text>
      )}

      {/* Command */}
      <View style={styles.commandContainer}>
        <Text style={[styles.commandText, { color: themeColors.textPrimary }]} numberOfLines={1}>
          $ {entry.parsedCommand}
        </Text>
        {entry.isDangerous && (
          <Icon name="warning" size={18} color={colors.status.error} />
        )}
      </View>

      {/* Status and Execution Time */}
      <View style={styles.statusRow}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: entry.exitCode === 0 ? colors.status.success + '20' : colors.status.error + '20' },
        ]}>
          <Text style={[
            styles.statusText,
            { color: entry.exitCode === 0 ? colors.status.success : colors.status.error }
          ]}>
            {entry.exitCode === 0 ? '成功' : `失败 (${entry.exitCode})`}
          </Text>
        </View>
        <Text style={[styles.executionTime, { color: themeColors.textMuted }]}>
          {entry.executionTime}ms
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  dangerousBorder: {
    // borderLeftColor set dynamically
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deviceName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
  },
  userInput: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  commandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  commandText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
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
});
