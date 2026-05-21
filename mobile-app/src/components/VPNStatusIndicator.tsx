/**
 * VPN Status Indicator Component
 * 
 * Displays VPN connection status and mesh IP
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useVPNStore } from '../stores/vpnStore';
import { useNavigation } from '@react-navigation/native';

export const VPNStatusIndicator: React.FC = () => {
  const { status, isConnected, connectionInfo } = useVPNStore();
  const navigation = useNavigation();

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#10B981';
      case 'connecting':
      case 'disconnecting':
      case 'reasserting':
        return '#F59E0B';
      case 'disconnected':
        return '#6B7280';
      default:
        return '#EF4444';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'VPN 已连接';
      case 'connecting':
        return 'VPN 连接中...';
      case 'disconnecting':
        return 'VPN 断开中...';
      case 'disconnected':
        return 'VPN 未连接';
      case 'reasserting':
        return 'VPN 重连中...';
      default:
        return 'VPN 状态异常';
    }
  };

  const handlePress = () => {
    navigation.navigate('VPNSettings' as never);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <View style={styles.textContainer}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          {isConnected && connectionInfo?.meshIP && (
            <Text style={styles.meshIP}>Mesh IP: {connectionInfo.meshIP}</Text>
          )}
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  meshIP: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#9CA3AF',
    marginLeft: 8,
  },
});
