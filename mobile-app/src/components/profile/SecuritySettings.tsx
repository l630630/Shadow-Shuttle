/**
 * Security Settings Component
 * 安全设置组件 - 2FA、密码、会话管理
 */

import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface Session {
  id: number;
  device: string;
  location: string;
  isCurrent: boolean;
  icon: string;
  time: string;
}

interface SecuritySettingsProps {
  is2FAEnabled: boolean;
  sessions: Session[];
  onToggle2FA: (value: boolean) => void;
  onChangePassword: () => void;
  onKickSession: (id: number) => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  is2FAEnabled,
  sessions,
  onToggle2FA,
  onChangePassword,
  onKickSession,
}) => {
  const themeColors = useTheme();

  const handleKickSession = (id: number) => {
    Alert.alert('踢出会话', '确定要踢出这个会话吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '踢出',
        style: 'destructive',
        onPress: () => onKickSession(id),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 2FA Toggle */}
      <View style={[styles.securityItem, { backgroundColor: themeColors.surfaceDarker }]}>
        <View style={styles.securityItemLeft}>
          <View
            style={[
              styles.securityItemIcon,
              {
                backgroundColor: is2FAEnabled
                  ? 'rgba(16,185,129,0.2)'
                  : 'rgba(100,116,139,0.2)',
              },
            ]}
          >
            <Icon
              name="verified-user"
              size={18}
              color={is2FAEnabled ? colors.success : themeColors.textSecondary}
            />
          </View>
          <View>
            <Text style={[styles.securityItemTitle, { color: themeColors.textPrimary }]}>
              两步验证
            </Text>
            <Text style={styles.securityItemDesc}>
              {is2FAEnabled ? '已启用 Authenticator' : '建议开启以保护账户'}
            </Text>
          </View>
        </View>
        <Switch
          value={is2FAEnabled}
          onValueChange={onToggle2FA}
          trackColor={{ false: '#475569', true: colors.success }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Change Password */}
      <TouchableOpacity
        style={[styles.securityItem, { backgroundColor: themeColors.surfaceDarker }]}
        onPress={onChangePassword}
      >
        <View style={styles.securityItemLeft}>
          <View
            style={[styles.securityItemIcon, { backgroundColor: 'rgba(100,116,139,0.2)' }]}
          >
            <Icon name="lock-reset" size={18} color={themeColors.textSecondary} />
          </View>
          <View>
            <Text style={[styles.securityItemTitle, { color: themeColors.textPrimary }]}>
              修改密码
            </Text>
            <Text style={styles.securityItemDesc}>上次修改: 30天前</Text>
          </View>
        </View>
        <Icon name="chevron-right" size={18} color={themeColors.textSecondary} />
      </TouchableOpacity>

      {/* Active Sessions */}
      <View style={styles.sessionsSection}>
        <Text style={styles.sessionsSectionTitle}>活跃会话</Text>
        {sessions.map((session) => (
          <View
            key={session.id}
            style={[
              styles.sessionItem,
              session.isCurrent && styles.sessionItemCurrent,
            ]}
          >
            <Icon name={session.icon} size={20} color={themeColors.textSecondary} />
            <View style={styles.sessionInfo}>
              <Text
                style={[
                  styles.sessionDevice,
                  { color: session.isCurrent ? themeColors.textPrimary : '#CBD5E1' },
                ]}
              >
                {session.device}
              </Text>
              <Text
                style={[
                  styles.sessionLocation,
                  {
                    color: session.isCurrent
                      ? colors.success
                      : themeColors.textSecondary,
                  },
                ]}
              >
                {session.isCurrent
                  ? `当前设备 • ${session.location}`
                  : `${session.time} • ${session.location}`}
              </Text>
            </View>
            {!session.isCurrent && (
              <TouchableOpacity
                style={styles.sessionKickButton}
                onPress={() => handleKickSession(session.id)}
              >
                <Text style={styles.sessionKickText}>踢出</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {sessions.length === 1 && (
          <View style={styles.sessionsEmpty}>
            <Text style={styles.sessionsEmptyText}>没有其他活跃会话</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  securityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  securityItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  securityItemDesc: {
    fontSize: 13,
    color: '#94A3B8',
  },
  sessionsSection: {
    marginTop: spacing.lg,
  },
  sessionsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(100,116,139,0.1)',
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  sessionItemCurrent: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  sessionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sessionDevice: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionLocation: {
    fontSize: 12,
  },
  sessionKickButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sessionKickText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  sessionsEmpty: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  sessionsEmptyText: {
    fontSize: 14,
    color: '#64748B',
  },
});
