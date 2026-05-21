/**
 * VPN Settings Screen
 * 
 * UI for VPN configuration and connection management
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useVPNStore } from '../stores/vpnStore';

export const VPNSettingsScreen: React.FC = () => {
  const {
    status,
    isConnected,
    isConfigured,
    isAutoReconnectEnabled,
    connectionInfo,
    error,
    isLoading,
    initialize,
    register,
    connect,
    disconnect,
    setAutoReconnect,
    clearConfiguration,
    clearError,
  } = useVPNStore();

  // Form state
  const [headscaleUrl, setHeadscaleUrl] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [preAuthKey, setPreAuthKey] = useState('');

  useEffect(() => {
    initialize();
  }, []);

  const handleRegister = async () => {
    if (!headscaleUrl || !deviceName || !preAuthKey) {
      Alert.alert('错误', '请填写所有字段');
      return;
    }

    try {
      await register({ headscaleUrl, deviceName, preAuthKey });
      Alert.alert('成功', '设备注册成功！');
      // Clear form
      setHeadscaleUrl('');
      setDeviceName('');
      setPreAuthKey('');
    } catch (error) {
      Alert.alert('注册失败', error instanceof Error ? error.message : '未知错误');
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      Alert.alert('连接失败', error instanceof Error ? error.message : '未知错误');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      Alert.alert('断开失败', error instanceof Error ? error.message : '未知错误');
    }
  };

  const handleClearConfig = () => {
    Alert.alert(
      '确认',
      '确定要清除 VPN 配置吗？这将断开当前连接。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearConfiguration();
              Alert.alert('成功', 'VPN 配置已清除');
            } catch (error) {
              Alert.alert('失败', error instanceof Error ? error.message : '未知错误');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#10B981';
      case 'connecting':
        return '#F59E0B';
      case 'disconnecting':
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
        return '已连接';
      case 'connecting':
        return '连接中...';
      case 'disconnecting':
        return '断开中...';
      case 'disconnected':
        return '未连接';
      case 'reasserting':
        return '重新连接...';
      default:
        return '无效';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>VPN 状态</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          {connectionInfo?.meshIP && (
            <Text style={styles.meshIP}>Mesh IP: {connectionInfo.meshIP}</Text>
          )}
          {connectionInfo?.connectedAt && (
            <Text style={styles.timestamp}>
              连接时间: {connectionInfo.connectedAt.toLocaleString('zh-CN')}
            </Text>
          )}
        </View>
      </View>

      {/* Connection Controls */}
      {isConfigured && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>连接控制</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={isConnected ? handleDisconnect : handleConnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {isConnected ? '断开连接' : '连接'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Auto-Reconnect Toggle */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>自动重连</Text>
            <Switch
              value={isAutoReconnectEnabled}
              onValueChange={setAutoReconnect}
              disabled={isLoading}
            />
          </View>
          <Text style={styles.settingDescription}>
            网络切换或应用恢复时自动重新连接
          </Text>
        </View>
      )}

      {/* Registration Form */}
      {!isConfigured && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设备注册</Text>
          <TextInput
            style={styles.input}
            placeholder="Headscale URL (例如: https://headscale.example.com)"
            value={headscaleUrl}
            onChangeText={setHeadscaleUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
          <TextInput
            style={styles.input}
            placeholder="设备名称"
            value={deviceName}
            onChangeText={setDeviceName}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="预授权密钥"
            value={preAuthKey}
            onChangeText={setPreAuthKey}
            autoCapitalize="none"
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>注册设备</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Advanced Settings */}
      {isConfigured && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>高级设置</Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleClearConfig}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>清除配置</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  meshIP: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  buttonGroup: {
    marginBottom: 16,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    flex: 1,
  },
  errorClose: {
    color: '#991B1B',
    fontSize: 18,
    fontWeight: 'bold',
    paddingLeft: 12,
  },
});
