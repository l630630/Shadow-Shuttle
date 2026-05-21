/**
 * Privacy Shield Card Component
 * 隐私护盾卡片组件
 */

import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface PrivacyShieldCardProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export const PrivacyShieldCard: React.FC<PrivacyShieldCardProps> = ({
  enabled,
  onToggle,
}) => {
  const themeColors = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
      <View style={styles.left}>
        <View style={styles.header}>
          <Icon name="security" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            隐私护盾
          </Text>
        </View>
        <Text style={[styles.desc, { color: themeColors.textSecondary }]}>
          通过主动 Mesh 加密保护您的身份。
        </Text>
        <View style={styles.toggle}>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            trackColor={{ false: '#232f48', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
          <Text style={styles.status}>已激活</Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={styles.imageOverlay} />
        <Icon name="security" size={48} color="rgba(255,255,255,0.5)" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  left: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  desc: {
    fontSize: 14,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  right: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageOverlay: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
});
