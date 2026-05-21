/**
 * Profile Header Component
 * 个人中心头部组件 - 用户卡片和统计信息
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Logo } from '../Logo';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface ProfileHeaderProps {
  username: string;
  deviceCount: number;
  uptime?: string;
  healthScore?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  deviceCount,
  uptime = '99%',
  healthScore = 'A+',
}) => {
  const themeColors = useTheme();

  return (
    <View style={[styles.userCard, { backgroundColor: themeColors.surface }]}>
      {/* Decorative blob */}
      <View style={styles.userCardBlob} />

      <View style={styles.userCardContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Logo size={64} showGlow={false} />
          <View style={styles.onlineIndicator} />
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: themeColors.textPrimary }]}>
            {username}
          </Text>
          <View style={styles.badge}>
            <Icon name="verified-user" size={12} color={colors.primary} />
            <Text style={styles.badgeText}>Root Access</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: themeColors.textPrimary }]}>
            {deviceCount}
          </Text>
          <Text style={styles.statLabel}>节点</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{uptime}</Text>
          <Text style={styles.statLabel}>在线率</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{healthScore}</Text>
          <Text style={styles.statLabel}>健康度</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.lg,
  },
  userCardBlob: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
