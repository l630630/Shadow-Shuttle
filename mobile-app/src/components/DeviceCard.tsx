/**
 * Device Card Component
 * 设备卡片组件
 * 
 * 基于 shadow-shuttle 的设计风格
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Device } from '../types/device';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import { useTheme } from '../hooks/useTheme';

interface DeviceCardProps {
  device: Device;
  onPress?: (device: Device) => void;
  onLongPress?: (device: Device) => void;
}

// 检测是否为 Mesh IP
const isMeshIP = (ip: string): boolean => {
  // Headscale/Tailscale 默认使用 100.64.0.0/10 网段
  const meshIPPattern = /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\.\d{1,3}\.\d{1,3}$/;
  return meshIPPattern.test(ip);
};

const getDeviceIcon = (device: Device): string => {
  const hostname = device.hostname.toLowerCase();
  if (hostname.includes('mac')) return 'laptop-mac';
  if (hostname.includes('win')) return 'desktop-windows';
  if (hostname.includes('linux') || hostname.includes('ubuntu')) return 'computer';
  if (hostname.includes('phone') || hostname.includes('mobile')) return 'smartphone';
  return 'devices';
};

const getDeviceIconColor = (device: Device): string => {
  const hostname = device.hostname.toLowerCase();
  if (hostname.includes('mac')) return '#64748B';
  if (hostname.includes('win')) return '#3B82F6';
  if (hostname.includes('linux')) return '#F97316';
  if (hostname.includes('phone')) return '#8B5CF6';
  return '#94A3B8';
};

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onPress,
  onLongPress,
}) => {
  const themeColors = useTheme();
  const isOnline = device.online;
  const iconColor = getDeviceIconColor(device);
  const isMesh = isMeshIP(device.meshIP);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
        shadows.md,
        !isOnline && styles.offline,
      ]}
      onPress={() => onPress?.(device)}
      onLongPress={() => onLongPress?.(device)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Device Icon */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: `${iconColor}20` }
        ]}>
          <Icon
            name={getDeviceIcon(device)}
            size={24}
            color={iconColor}
          />
        </View>

        {/* Device Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.name,
                { color: themeColors.textPrimary }
              ]}
              numberOfLines={1}
            >
              {device.name}
            </Text>
            {/* Connection Method Badge */}
            <View style={[
              styles.badge,
              { backgroundColor: isMesh ? '#10B98120' : '#6B728020' }
            ]}>
              <Icon
                name={isMesh ? 'vpn-lock' : 'wifi'}
                size={12}
                color={isMesh ? '#10B981' : '#6B7280'}
                style={styles.badgeIcon}
              />
              <Text style={[
                styles.badgeText,
                { color: isMesh ? '#10B981' : '#6B7280' }
              ]}>
                {isMesh ? 'Mesh' : 'LAN'}
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.ip,
              { color: themeColors.textMuted }
            ]}
            numberOfLines={1}
          >
            {device.meshIP}
          </Text>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            {
              backgroundColor: isOnline ? colors.online : colors.offline,
            }
          ]} />
          <Icon
            name="chevron-right"
            size={20}
            color={themeColors.textMuted}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  offline: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginRight: spacing.xs,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeIcon: {
    marginRight: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  ip: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
});

export default DeviceCard;
