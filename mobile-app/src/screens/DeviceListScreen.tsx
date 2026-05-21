/**
 * Device List Screen (S2)
 * 设备列表页 - 展示所有在线且已配对的电脑设备
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Device } from '../types/device';
import { getDeviceDiscoveryService } from '../services/deviceDiscoveryService';
import { getAPIConfig } from '../config/api';
import { useDeviceStore } from '../stores/deviceStore';
import { useVPNStore } from '../stores/vpnStore';
import { Header } from '../components/Header';
import { DeviceCard } from '../components/DeviceCard';
import { VPNStatusIndicator } from '../components/VPNStatusIndicator';
import { EmptyState } from '../components/EmptyState';
import { colors, typography, spacing, borderRadius, shadows, layout } from '../styles/theme';
import { useTheme } from '../hooks/useTheme';

interface DeviceListScreenProps {
  navigation: any;
}

export const DeviceListScreen: React.FC<DeviceListScreenProps> = ({
  navigation,
}) => {
  const themeColors = useTheme();
  
  // ✨ 直接使用 deviceStore 的持久化数据
  const { 
    devices, 
    updateDeviceStatus, 
    removeDevice: removeDeviceFromStore,
    clearDevices, // 添加清除所有设备功能
  } = useDeviceStore();
  
  // VPN Store
  const { isConnected: vpnConnected, connectionInfo } = useVPNStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading] = useState(false);
  
  const config = getAPIConfig();
  const discoveryService = getDeviceDiscoveryService({
    headscaleUrl: config.headscale.url,
    apiKey: config.headscale.apiKey,
  });

  // 刷新设备状态（不重新发现设备）
  const onRefresh = useCallback(async () => {
    if (!vpnConnected || devices.length === 0) {
      return;
    }
    
    setRefreshing(true);
    console.log('🔵 [DeviceListScreen] Refreshing device statuses...');
    
    try {
      const deviceIds = devices.map(d => d.id);
      const statusMap = await discoveryService.checkMultipleDeviceStatuses(deviceIds);
      
      // 更新设备状态
      for (const device of devices) {
        const isOnline = statusMap.get(device.id) || false;
        if (device.online !== isOnline) {
          updateDeviceStatus(device.id, isOnline);
          console.log(`✅ [DeviceListScreen] Updated ${device.name}: ${isOnline ? 'online' : 'offline'}`);
        }
      }
    } catch (error) {
      console.error('❌ [DeviceListScreen] Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [vpnConnected, devices]);
  // 删除设备
  const removeDevice = useCallback(async (deviceId: string) => {
    try {
      await removeDeviceFromStore(deviceId);
      console.log('✅ [DeviceListScreen] Device removed:', deviceId);
    } catch (error) {
      console.error('❌ [DeviceListScreen] Failed to remove device:', error);
      Alert.alert('删除失败', '无法删除设备，请重试', [{ text: '确定' }]);
    }
  }, [removeDeviceFromStore]);

  // 清除所有设备
  const handleClearAllDevices = useCallback(() => {
    if (devices.length === 0) {
      Alert.alert('提示', '没有设备需要清除', [{ text: '确定' }]);
      return;
    }

    Alert.alert(
      '清除所有设备',
      `确定要删除所有 ${devices.length} 个设备吗？此操作无法撤销。`,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearDevices();
              console.log('✅ [DeviceListScreen] All devices cleared');
              Alert.alert('成功', '已清除所有设备', [{ text: '确定' }]);
            } catch (error) {
              console.error('❌ [DeviceListScreen] Failed to clear devices:', error);
              Alert.alert('失败', '清除设备失败，请重试', [{ text: '确定' }]);
            }
          },
        },
      ]
    );
  }, [devices.length, clearDevices]);

  // 处理设备点击
  const handleDevicePress = (device: Device) => {
    if (!vpnConnected) {
      Alert.alert(
        '未连接 VPN',
        '请先连接到 VPN 网络才能访问设备',
        [{ text: '确定' }]
      );
      return;
    }

    // 移除离线检查 - SSH 连接不依赖 HTTP API
    // 即使设备显示离线，也允许尝试 SSH 连接
    // if (!device.online) {
    //   Alert.alert(
    //     '设备离线',
    //     `${device.name} 当前离线，无法连接`,
    //     [{ text: '确定' }]
    //   );
    //   return;
    // }

    // 显示选项：AI 对话 或 SSH 终端
    Alert.alert(
      device.name,
      device.online ? '选择连接方式' : '设备可能离线，是否尝试连接？',
      [
        {
          text: 'AI 对话助手',
          onPress: () => navigation.navigate('AIChat', { device }),
        },
        {
          text: 'SSH 终端',
          onPress: () => navigation.navigate('Terminal', { device }),
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ]
    );
  };

  // 处理设备长按（显示操作菜单）
  const handleDeviceLongPress = (device: Device) => {
    Alert.alert(
      device.name,
      '选择操作',
      [
        {
          text: '删除设备',
          style: 'destructive',
          onPress: () => confirmRemoveDevice(device),
        },
        {
          text: '查看详情',
          onPress: () => showDeviceDetails(device),
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ]
    );
  };

  // 确认删除设备
  const confirmRemoveDevice = (device: Device) => {
    Alert.alert(
      '删除设备',
      `确定要删除 ${device.name} 吗？`,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => removeDevice(device.id),
        },
      ]
    );
  };

  // 显示设备详情
  const showDeviceDetails = (device: Device) => {
    const lastSeenText = device.lastSeen.toLocaleString('zh-CN');
    const connectionMethod = isMeshIP(device.meshIP) ? 'Mesh 网络' : '局域网';
    
    Alert.alert(
      '设备详情',
      `设备名: ${device.name}\n` +
      `主机名: ${device.hostname}\n` +
      `IP 地址: ${device.meshIP}\n` +
      `连接方式: ${connectionMethod}\n` +
      `SSH 端口: ${device.sshPort}\n` +
      `状态: ${device.online ? '在线' : '离线'}\n` +
      `最后在线: ${lastSeenText}`,
      [{ text: '确定' }]
    );
  };

  // 检测是否为 Mesh IP
  const isMeshIP = (ip: string): boolean => {
    // Headscale/Tailscale 默认使用 100.64.0.0/10 网段
    const meshIPPattern = /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\.\d{1,3}\.\d{1,3}$/;
    return meshIPPattern.test(ip);
  };

  // 渲染设备项
  const renderDevice = ({ item }: { item: Device }) => (
    <DeviceCard
      device={item}
      onPress={handleDevicePress}
      onLongPress={handleDeviceLongPress}
    />
  );

  // 渲染空状态
  const renderEmptyState = () => (
    <EmptyState
      icon="devices"
      title={!vpnConnected ? '请先连接 VPN' : '还没有配对的设备'}
      description={!vpnConnected
        ? '连接 VPN 后可以查看和管理设备'
        : '点击下方按钮扫码配对新设备'}
    />
  );

  // 过滤在线设备和 Mesh 设备
  const onlineDevices = devices.filter(d => d.online);
  const meshDevices = devices.filter(d => isMeshIP(d.meshIP));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <Header
        title="设备列表"
        subtitle={`在线: ${onlineDevices.length} / Mesh: ${meshDevices.length} / 总计: ${devices.length}`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: devices.length > 0 ? 'delete-sweep' : 'refresh',
          onPress: devices.length > 0 ? handleClearAllDevices : onRefresh,
        }}
      />

      {/* VPN Status Indicator */}
      <VPNStatusIndicator />

      {/* Warning Banner */}
      {!vpnConnected && (
        <View style={[styles.warningBanner, { backgroundColor: colors.status.warning + '20' }]}>
          <Icon name="warning" size={20} color={colors.status.warning} />
          <Text style={[styles.warningText, { color: colors.status.warning }]}>
            未连接 VPN，无法访问 Mesh 网络设备
          </Text>
        </View>
      )}

      {/* Device List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            加载设备中...
          </Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* FAB - Scan Button */}
      <TouchableOpacity
        style={[styles.fab, shadows.primary]}
        onPress={() => navigation.navigate('QRScanner')}
        activeOpacity={0.8}
      >
        <Icon name="qr-code-scanner" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: layout.fabBottom + layout.fabSize + spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: layout.fabBottom,
    right: layout.fabRight,
    width: layout.fabSize,
    height: layout.fabSize,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
