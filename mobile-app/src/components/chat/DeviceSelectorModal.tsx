/**
 * 设备选择弹窗组件
 * 用于切换连接的设备
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface Device {
  id: string;
  name: string;
  meshIP: string;
  os: string;
  online: boolean;
}

interface DeviceSelectorModalProps {
  visible: boolean;
  devices: Device[];
  selectedDeviceId: string;
  onClose: () => void;
  onSelectDevice: (deviceId: string) => void;
  onAddDevice: () => void;
}

export const DeviceSelectorModal: React.FC<DeviceSelectorModalProps> = ({
  visible,
  devices,
  selectedDeviceId,
  onClose,
  onSelectDevice,
  onAddDevice,
}) => {
  const themeColors = useTheme();

  const renderDevice = ({ item: device }: { item: Device }) => {
    const isSelected = selectedDeviceId === device.id;
    const isOnline = device.online;

    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          {
            backgroundColor: isSelected
              ? colors.primary + '20'
              : themeColors.surfaceDarker,
            borderColor: isSelected ? colors.primary + '80' : 'transparent',
          },
          !isOnline && !isSelected && styles.deviceItemOffline,
        ]}
        onPress={() => onSelectDevice(device.id)}
        activeOpacity={0.7}
      >
        {/* 设备图标 */}
        <View
          style={[
            styles.deviceIcon,
            {
              backgroundColor: isSelected ? colors.primary : themeColors.background,
            },
          ]}
        >
          <Icon
            name={
              device.os === 'windows'
                ? 'desktop-windows'
                : device.os === 'macos'
                ? 'laptop'
                : 'dns'
            }
            size={24}
            color={isSelected ? '#FFFFFF' : themeColors.textSecondary}
          />
        </View>

        {/* 设备信息 */}
        <View style={styles.deviceInfo}>
          <View style={styles.deviceNameRow}>
            <Text
              style={[
                styles.deviceName,
                {
                  color: isSelected
                    ? themeColors.textPrimary
                    : themeColors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {device.name}
            </Text>
            {!isOnline && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineBadgeText}>离线</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.deviceIp,
              {
                color: isSelected
                  ? colors.primary + 'CC'
                  : themeColors.textMuted,
              },
            ]}
            numberOfLines={1}
          >
            {device.meshIP}
          </Text>
        </View>

        {/* 选中指示器 */}
        {isSelected && <Icon name="check-circle" size={20} color={colors.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
          {/* 标题栏 */}
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: themeColors.surfaceDarker,
                borderBottomColor: themeColors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
              切换连接设备
            </Text>
            <TouchableOpacity
              style={[
                styles.modalCloseButton,
                { backgroundColor: themeColors.background },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Icon name="close" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* 设备列表 */}
          <FlatList
            data={devices}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.deviceList}
            renderItem={renderDevice}
          />

          {/* 添加设备按钮 */}
          <View
            style={[
              styles.modalFooter,
              {
                backgroundColor: themeColors.surfaceDarker,
                borderTopColor: themeColors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.addDeviceButton, { borderColor: themeColors.border }]}
              onPress={() => {
                onClose();
                onAddDevice();
              }}
              activeOpacity={0.7}
            >
              <Icon name="add" size={18} color={themeColors.textSecondary} />
              <Text style={[styles.addDeviceText, { color: themeColors.textSecondary }]}>
                添加新设备
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceList: {
    padding: spacing.md,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
  },
  deviceItemOffline: {
    opacity: 0.5,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  offlineBadge: {
    backgroundColor: colors.status.error + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  offlineBadgeText: {
    fontSize: 11,
    color: colors.status.error,
    fontWeight: '600',
  },
  deviceIp: {
    fontSize: 13,
  },
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  addDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addDeviceText: {
    fontSize: 14,
    marginLeft: spacing.xs,
  },
});
