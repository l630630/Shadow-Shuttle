/**
 * Stat Card Component
 * 统计卡片组件
 * 
 * 基于 shadow-shuttle 的设计风格
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius, shadows, getThemeColors } from '../styles/theme';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  iconColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconColor,
}) => {
  const isDarkMode = true; // 强制 Dark 模式
  const themeColors = getThemeColors(isDarkMode);

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      },
      shadows.md,
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.textSecondary }]}>
          {title}
        </Text>
        <Icon name={icon} size={20} color={iconColor} />
      </View>

      {/* Value */}
      <Text style={[styles.value, { color: themeColors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  value: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
  },
});

export default StatCard;
