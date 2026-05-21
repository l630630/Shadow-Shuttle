/**
 * History Filter Modal Component
 * 历史记录筛选模态框组件
 * 
 * 提供设备、时间范围、危险命令等筛选选项
 * Requirement 6.5: Filter by device, time range, dangerous flag
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetModal } from '../BottomSheetModal';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';
import { TimeRange } from '../../hooks/useHistoryFilters';

interface Device {
  id: string;
  name: string;
}

interface HistoryFilterModalProps {
  visible: boolean;
  onClose: () => void;
  // Filter state
  selectedDeviceId?: string;
  timeRange: TimeRange;
  showDangerousOnly: boolean;
  // Setters
  onDeviceChange: (deviceId?: string) => void;
  onTimeRangeChange: (range: TimeRange) => void;
  onDangerousOnlyChange: (value: boolean) => void;
  onReset: () => void;
  // Data
  devices: Device[];
}

export const HistoryFilterModal: React.FC<HistoryFilterModalProps> = ({
  visible,
  onClose,
  selectedDeviceId,
  timeRange,
  showDangerousOnly,
  onDeviceChange,
  onTimeRangeChange,
  onDangerousOnlyChange,
  onReset,
  devices,
}) => {
  const themeColors = useTheme();

  const timeRangeOptions = [
    { value: 'all' as TimeRange, label: '全部时间' },
    { value: 'today' as TimeRange, label: '今天' },
    { value: 'week' as TimeRange, label: '最近7天' },
    { value: 'month' as TimeRange, label: '本月' },
    { value: 'custom' as TimeRange, label: '自定义' },
  ];

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="筛选条件"
      footer={
        <>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: themeColors.surfaceDarker }]}
            onPress={onReset}
            activeOpacity={0.8}
          >
            <Text style={[styles.modalButtonText, { color: themeColors.textPrimary }]}>
              重置
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalButtonPrimary, shadows.sm]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.modalButtonText}>应用</Text>
          </TouchableOpacity>
        </>
      }
    >
      {/* Device Filter */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: themeColors.textPrimary }]}>
          设备
        </Text>
        <TouchableOpacity
          style={[
            styles.filterOption,
            { backgroundColor: themeColors.surfaceDarker },
            !selectedDeviceId && styles.filterOptionSelected,
          ]}
          onPress={() => onDeviceChange(undefined)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterOptionText, { color: themeColors.textPrimary }]}>
            全部设备
          </Text>
          {!selectedDeviceId && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        {devices.map(device => (
          <TouchableOpacity
            key={device.id}
            style={[
              styles.filterOption,
              { backgroundColor: themeColors.surfaceDarker },
              selectedDeviceId === device.id && styles.filterOptionSelected,
            ]}
            onPress={() => onDeviceChange(device.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterOptionText, { color: themeColors.textPrimary }]}>
              {device.name}
            </Text>
            {selectedDeviceId === device.id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Time Range Filter */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: themeColors.textPrimary }]}>
          时间范围
        </Text>
        {timeRangeOptions.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterOption,
              { backgroundColor: themeColors.surfaceDarker },
              timeRange === option.value && styles.filterOptionSelected,
            ]}
            onPress={() => onTimeRangeChange(option.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterOptionText, { color: themeColors.textPrimary }]}>
              {option.label}
            </Text>
            {timeRange === option.value && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Dangerous Commands Filter */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: themeColors.textPrimary }]}>
          命令类型
        </Text>
        <TouchableOpacity
          style={[
            styles.filterOption,
            { backgroundColor: themeColors.surfaceDarker },
            showDangerousOnly && styles.filterOptionSelected,
          ]}
          onPress={() => onDangerousOnlyChange(!showDangerousOnly)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterOptionText, { color: themeColors.textPrimary }]}>
            只显示危险命令
          </Text>
          {showDangerousOnly && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  filterSection: {
    marginBottom: spacing.xl,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  filterOptionSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: typography.fontSize.sm,
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});
