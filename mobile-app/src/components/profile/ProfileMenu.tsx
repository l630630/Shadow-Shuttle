/**
 * Profile Menu Component
 * 个人中心菜单组件
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
}

interface ProfileMenuProps {
  items: MenuItem[];
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ items }) => {
  const themeColors = useTheme();

  return (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>功能与设置</Text>

      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.menuItem, { backgroundColor: themeColors.surface }]}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
            <Icon name={item.icon} size={24} color={item.iconColor} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, { color: themeColors.textPrimary }]}>
              {item.title}
            </Text>
            <Text style={[styles.menuSubtitle, { color: themeColors.textSecondary }]}>
              {item.subtitle}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={themeColors.textSecondary} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  menuSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
  },
});
