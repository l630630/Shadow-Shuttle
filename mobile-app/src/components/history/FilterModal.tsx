/**
 * Filter Modal Component
 * 筛选模态框组件
 * 
 * Provides filtering options for command history by device, time range, and command type.
 * 提供命令历史的筛选选项，包括设备、时间范围和命令类型。
 * 
 * Requirements: 6.5
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetModal } from '../BottomSheetModal';
import { TimeRange } from '../../hooks/useCommandHistory';
import { colors, typography, spacing, borderRadius, shadows } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * Device option for filtering
 */
interface DeviceOption {
  id: string;
  name: string;
}

/**
 * Filter Modal Props
 */
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  
  // Filter state
  selectedDeviceId: string | undefined;
  timeRange: TimeRange;
  showDangerousOnly: boolean;
  
  // Filter actions
  onDeviceChange: (deviceId: string | undefined) => void;
  onTimeRangeChange: (range: TimeRange) => void;
  onDangerousOnlyChange: (show: boolean) => void;
  onReset: () => void;
  
  // Device options
  devices: DeviceOption[];
}

/**
 * Time range options
 */
const TIME_RANGE_OPTIONS = [
  { value: 'all' as TimeRange, label: '全部时间' },
  { value: 'today' as TimeRange, label: '今天' },
  { value: 'week' as TimeRange, label: '最近7天' },
  { value: 'month' as TimeRange, label: '本月' },
  { value: 'custom' as TimeRange, label: '自定义' },
];

/**
 * Filter Modal Component
 * 筛选模态框组件
 * 
 * Requirement 6.5: Filter by device, time range, dangerous flag
 */
export const FilterModal: React.FC<FilterModalProps> = ({
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

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="筛选条件"
      footer={
        <>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.surfaceDarker }]}
            onPress={onReset}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: themeColors.textPrimary }]}>
              重置
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, shadows.sm]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>应用</Text>
          </TouchableOpacity>
        </>
      }
    >
      {/* Device Filter */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: themeColors.textPrimary }]}>
          设备
        </Text>
        <TouchableOpacity
          style={[
            styles.option,
            { backgroundColor: themeColors.surfaceDarker },
            !selectedDeviceId && styles.optionSelected,
          ]}
          onPress={() => onDeviceChange(undefined)}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionText, { color: themeColors.textPrimary }]}>
            全部设备
          </Text>
          {!selectedDeviceId && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        {devices.map(device => (
          <TouchableOpacity
            key={device.id}
            style={[
              styles.option,
              { backgroundColor: themeColors.surfaceDarker },
              selectedDeviceId === device.id && styles.optionSelected,
            ]}
            onPress={() => onDeviceChange(device.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, { color: themeColors.textPrimary }]}>
              {device.name}
            </Text>
            {selectedDeviceId === device.id && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Time Range Filter */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: themeColors.textPrimary }]}>
          时间范围
        </Text>
        {TIME_RANGE_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              { backgroundColor: themeColors.surfaceDarker },
              timeRange === option.value && styles.optionSelected,
            ]}
            onPress={() => onTimeRangeChange(option.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, { color: themeColors.textPrimary }]}>
              {option.label}
            </Text>
            {timeRange === option.value && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Dangerous Commands Filter */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: themeColors.textPrimary }]}>
          命令类型
        </Text>
        <TouchableOpacity
          style={[
            styles.option,
            { backgroundColor: themeColors.surfaceDarker },
            showDangerousOnly && styles.optionSelected,
          ]}
          onPress={() => onDangerousOnlyChange(!showDangerousOnly)}
          activeOpacity={0.7}
        >
          <Text style={[styles.optionText, { color: themeColors.textPrimary }]}>
            只显示危险命令
          </Text>
          {showDangerousOnly && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  optionSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: typography.fontSize.sm,
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
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
