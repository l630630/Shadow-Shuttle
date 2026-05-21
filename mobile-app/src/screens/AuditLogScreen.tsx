/**
 * Audit Log Screen
 * 审计日志界面
 * 
 * Displays audit logs with filtering and export capabilities.
 * Shows risk level indicators and detailed execution information.
 * 
 * Requirements: 11.3, 11.4, 11.5
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Header } from '../components/Header';
import { auditLogStore } from '../stores/auditLogStore';
import { AuditLogEntry, RiskLevel } from '../types/nlc';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { useTheme } from '../hooks/useTheme';
import { EmptyState } from '../components/EmptyState';
import { BottomSheetModal } from '../components/BottomSheetModal';

interface AuditLogScreenProps {
  navigation: any;
}

export const AuditLogScreen: React.FC<AuditLogScreenProps> = ({
  navigation,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterRiskLevel, setFilterRiskLevel] = useState<RiskLevel | null>(
    null
  );
  const themeColors = useTheme();

  // Load logs on mount
  useEffect(() => {
    loadLogs();
  }, [filterRiskLevel]);

  const loadLogs = async () => {
    const filter = filterRiskLevel ? { riskLevel: filterRiskLevel } : undefined;
    const data = await auditLogStore.getLogs(filter, 100);
    setLogs(data);
  };

  const getRiskLevelColor = (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case 'high':
        return colors.status.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return themeColors.textSecondary;
    }
  };

  const getRiskLevelLabel = (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case 'high':
        return '高风险';
      case 'medium':
        return '中风险';
      case 'low':
        return '低风险';
      default:
        return '未知';
    }
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const filter = filterRiskLevel
        ? { riskLevel: filterRiskLevel }
        : undefined;
      const content = await auditLogStore.exportLogs(format, filter);

      // Share the exported content
      await Share.share({
        message: content,
        title: `审计日志导出 (${format.toUpperCase()})`,
      });
    } catch (error) {
      Alert.alert(
        '导出失败',
        error instanceof Error ? error.message : '未知错误'
      );
    }
  };

  const renderLogItem = ({ item }: { item: AuditLogEntry }) => (
    <TouchableOpacity
      style={[styles.logCard, { backgroundColor: themeColors.surface }]}
      onPress={() => {
        setSelectedLog(item);
        setShowDetailModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.logHeader}>
        <View
          style={[
            styles.riskBadge,
            { backgroundColor: `${getRiskLevelColor(item.riskLevel)}20` },
          ]}
        >
          <Text
            style={[
              styles.riskText,
              { color: getRiskLevelColor(item.riskLevel) },
            ]}
          >
            {getRiskLevelLabel(item.riskLevel)}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: themeColors.textMuted }]}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>

      <Text
        style={[styles.userInput, { color: themeColors.textPrimary }]}
        numberOfLines={2}
      >
        {item.userInput}
      </Text>

      <View
        style={[styles.commandBlock, { backgroundColor: themeColors.background }]}
      >
        <Icon
          name="terminal"
          size={14}
          color={colors.success}
          style={styles.commandIcon}
        />
        <Text
          style={[styles.commandText, { color: colors.success }]}
          numberOfLines={1}
        >
          {item.executedCommand}
        </Text>
      </View>

      <View style={styles.logFooter}>
        <View style={styles.exitCodeBadge}>
          <Icon
            name={item.exitCode === 0 ? 'check-circle' : 'error'}
            size={14}
            color={item.exitCode === 0 ? colors.success : colors.status.error}
          />
          <Text
            style={[
              styles.exitCodeText,
              {
                color:
                  item.exitCode === 0 ? colors.success : colors.status.error,
              },
            ]}
          >
            退出码: {item.exitCode}
          </Text>
        </View>
        <Text style={[styles.executionTime, { color: themeColors.textMuted }]}>
          {item.executionTime}ms
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!selectedLog) return null;

    return (
      <BottomSheetModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="日志详情"
      >
        {/* Risk Level */}
        <View style={styles.detailSection}>
          <Text
            style={[
              styles.detailLabel,
              { color: themeColors.textSecondary },
            ]}
          >
            风险等级
          </Text>
          <View
            style={[
              styles.riskBadge,
              {
                backgroundColor: `${getRiskLevelColor(
                  selectedLog.riskLevel
                )}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.riskText,
                { color: getRiskLevelColor(selectedLog.riskLevel) },
              ]}
            >
              {getRiskLevelLabel(selectedLog.riskLevel)}
            </Text>
          </View>
        </View>

        {/* Timestamp */}
        <View style={styles.detailSection}>
          <Text
            style={[
              styles.detailLabel,
              { color: themeColors.textSecondary },
            ]}
          >
            执行时间
          </Text>
          <Text
            style={[
              styles.detailValue,
              { color: themeColors.textPrimary },
            ]}
          >
            {formatTimestamp(selectedLog.timestamp)}
          </Text>
        </View>

        {/* User Input */}
        <View style={styles.detailSection}>
          <Text
            style={[
              styles.detailLabel,
              { color: themeColors.textSecondary },
            ]}
          >
            用户输入
          </Text>
          <Text
            style={[
              styles.detailValue,
              { color: themeColors.textPrimary },
            ]}
          >
            {selectedLog.userInput}
          </Text>
        </View>

        {/* AI Parsed Command */}
        <View style={styles.detailSection}>
          <Text
            style={[
              styles.detailLabel,
              { color: themeColors.textSecondary },
            ]}
          >
            AI 解析命令
          </Text>
          <View
            style={[
              styles.codeBlock,
              { backgroundColor: themeColors.background },
            ]}
          >
            <Text style={[styles.codeText, { color: colors.success }]}>
              {selectedLog.aiParsedCommand}
            </Text>
          </View>
        </View>

        {/* Executed Command */}
        <View style={styles.detailSection}>
          <Text
            style={[
              styles.detailLabel,
              { color: themeColors.textSecondary },
            ]}
          >
            实际执行命令
          </Text>
          <View
            style={[
              styles.codeBlock,
              { backgroundColor: themeColors.background },
            ]}
          >
            <Text style={[styles.codeText, { color: colors.success }]}>
              {selectedLog.executedCommand}
            </Text>
          </View>
        </View>

        {/* Output */}
        <View style={styles.detailSection}>
          <Text
            style={[
              styles.detailLabel,
              { color: themeColors.textSecondary },
            ]}
          >
            输出
          </Text>
          <View
            style={[
              styles.codeBlock,
              { backgroundColor: themeColors.background },
            ]}
          >
            <Text
              style={[styles.codeText, { color: themeColors.textPrimary }]}
            >
              {selectedLog.output || '(无输出)'}
            </Text>
          </View>
        </View>

        {/* Exit Code */}
        <View style={styles.detailSection}>
          <Text
            style={[
              styles.detailLabel,
              { color: themeColors.textSecondary },
            ]}
          >
            退出码
          </Text>
          <View style={styles.exitCodeBadge}>
            <Icon
              name={
                selectedLog.exitCode === 0 ? 'check-circle' : 'error'
              }
              size={16}
              color={
                selectedLog.exitCode === 0
                  ? colors.success
                  : colors.status.error
              }
            />
            <Text
              style={[
                styles.exitCodeText,
                {
                  color:
                    selectedLog.exitCode === 0
                      ? colors.success
                      : colors.status.error,
                },
              ]}
            >
              {selectedLog.exitCode}
            </Text>
          </View>
        </View>

        {/* Execution Time */}
        <View style={styles.detailSection}>
          <Text
            style={[
              styles.detailLabel,
              { color: themeColors.textSecondary },
            ]}
          >
            执行时长
          </Text>
          <Text
            style={[
              styles.detailValue,
              { color: themeColors.textPrimary },
            ]}
          >
            {selectedLog.executionTime} ms
          </Text>
        </View>

        {/* Was Confirmed */}
        <View style={styles.detailSection}>
          <Text
            style={[
              styles.detailLabel,
              { color: themeColors.textSecondary },
            ]}
          >
            用户确认
          </Text>
          <Text
            style={[
              styles.detailValue,
              { color: themeColors.textPrimary },
            ]}
          >
            {selectedLog.wasConfirmed ? '是' : '否'}
          </Text>
        </View>
      </BottomSheetModal>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      icon="history"
      title="还没有审计日志"
      description="执行命令后会自动记录审计日志"
    />
  );

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <Header
        title="审计日志"
        subtitle={`${logs.length} 条记录`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'file-download',
          onPress: () => {
            Alert.alert('导出日志', '选择导出格式', [
              { text: '取消', style: 'cancel' },
              { text: 'JSON', onPress: () => handleExport('json') },
              { text: 'CSV', onPress: () => handleExport('csv') },
            ]);
          },
        }}
      />

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  filterRiskLevel === null
                    ? colors.primary
                    : themeColors.surface,
              },
            ]}
            onPress={() => setFilterRiskLevel(null)}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color:
                    filterRiskLevel === null
                      ? '#FFFFFF'
                      : themeColors.textPrimary,
                },
              ]}
            >
              全部
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  filterRiskLevel === 'high'
                    ? colors.status.error
                    : themeColors.surface,
              },
            ]}
            onPress={() => setFilterRiskLevel('high')}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color:
                    filterRiskLevel === 'high'
                      ? '#FFFFFF'
                      : themeColors.textPrimary,
                },
              ]}
            >
              高风险
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  filterRiskLevel === 'medium'
                    ? colors.warning
                    : themeColors.surface,
              },
            ]}
            onPress={() => setFilterRiskLevel('medium')}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color:
                    filterRiskLevel === 'medium'
                      ? '#FFFFFF'
                      : themeColors.textPrimary,
                },
              ]}
            >
              中风险
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  filterRiskLevel === 'low'
                    ? colors.success
                    : themeColors.surface,
              },
            ]}
            onPress={() => setFilterRiskLevel('low')}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color:
                    filterRiskLevel === 'low'
                      ? '#FFFFFF'
                      : themeColors.textPrimary,
                },
              ]}
            >
              低风险
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={logs}
        renderItem={renderLogItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />

      {renderDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  listContent: {
    padding: spacing.lg,
  },
  logCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  riskBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  riskText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
  },
  userInput: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  commandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  commandIcon: {
    marginRight: spacing.sm,
  },
  commandText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exitCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exitCodeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  executionTime: {
    fontSize: typography.fontSize.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  modalBody: {
    padding: spacing.lg,
  },
  detailSection: {
    marginBottom: spacing.lg,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
  },
  codeBlock: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  codeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
