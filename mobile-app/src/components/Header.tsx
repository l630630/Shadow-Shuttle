/**
 * Header Component
 * 页面头部组件
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
import { colors, typography, spacing, borderRadius, getThemeColors } from '../styles/theme';
import { Logo } from './Logo';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showSearch?: boolean;
  showProfile?: boolean;
  onBack?: () => void;
  onSearch?: () => void;
  onProfile?: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  showLogo = false,
  showSearch = false,
  showProfile = false,
  onBack,
  onSearch,
  onProfile,
  rightAction,
}) => {
  const isDarkMode = true; // 强制 Dark 模式
  const themeColors = getThemeColors(isDarkMode);

  return (
    <View style={[
      styles.container,
      { backgroundColor: themeColors.surface }
    ]}>
      {/* Left Side */}
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}

        {showLogo && (
          <View style={styles.logoContainer}>
            {/* Logo Icon - 使用 Logo 组件 */}
            <Logo size={40} showGlow={false} />

            {/* Logo Text */}
            <View>
              <Text style={[styles.logoText, { color: themeColors.textPrimary }]}>
                SHADOW<Text style={styles.logoAccent}>SHUTTLE</Text>
              </Text>
              <View style={styles.logoSubtitle}>
                <View style={styles.logoDivider} />
                <Text style={styles.logoSubtitleText}>Mesh Verified</Text>
              </View>
            </View>
          </View>
        )}

        {title && !showLogo && (
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Right Side */}
      <View style={styles.right}>
        {showSearch && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSearch}
            activeOpacity={0.7}
          >
            <Icon name="search" size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>
        )}

        {rightAction && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={rightAction.onPress}
            activeOpacity={0.7}
          >
            <Icon name={rightAction.icon} size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>
        )}

        {showProfile && (
          <TouchableOpacity
            style={styles.avatar}
            onPress={onProfile}
            activeOpacity={0.7}
          >
            <Icon name="person" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },

  // Left Side
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },

  // Logo
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.black,
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  logoAccent: {
    color: colors.primary,
    fontStyle: 'normal',
  },
  logoSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  logoDivider: {
    width: 12,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  logoSubtitleText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Title
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },

  // Right Side
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  // Icon Button
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Header;
