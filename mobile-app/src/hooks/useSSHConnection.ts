/**
 * SSH 连接管理 Hook
 * 处理 SSH 连接、密码保存和自动连接
 */

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getSSHService, SSHConnectionConfig } from '../services/sshService';

interface Device {
  id: string;
  name: string;
  meshIP: string;
  sshPort: number;
  hostname: string;
}

export const useSSHConnection = (device: Device | undefined) => {
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [sshSessionId, setSshSessionId] = useState<string | null>(null);
  const [isCheckingPassword, setIsCheckingPassword] = useState(true);

  const sshService = getSSHService();

  // 加载保存的密码并自动连接
  useEffect(() => {
    if (device) {
      loadSavedPassword();
    }
  }, [device?.id]);

  const loadSavedPassword = async () => {
    if (!device) return;

    setIsCheckingPassword(true);

    try {
      const { getKeyStorageService } = await import('../services/keyStorageService');
      const keyStorage = getKeyStorageService();

      const savedPassword = await keyStorage.getPassword(device.id);

      if (savedPassword) {
        console.log('✅ Found saved password for device:', device.id);
        setPassword(savedPassword);
        await autoConnect(savedPassword);
      } else {
        console.log('ℹ️ No saved password for device:', device.id);
        setNeedsPassword(true);
        setIsCheckingPassword(false);
      }
    } catch (error) {
      console.error('Failed to load saved password:', error);
      setNeedsPassword(true);
      setIsCheckingPassword(false);
    }
  };

  const autoConnect = async (savedPassword: string) => {
    if (!device) return;

    setConnecting(true);
    setIsCheckingPassword(true);

    try {
      const config: SSHConnectionConfig = {
        host: device.meshIP,
        port: device.sshPort,
        username: 'a0000',
        password: savedPassword,
      };

      const sessionId = await sshService.connect(device, config);
      setSshSessionId(sessionId);
      setNeedsPassword(false);
      setConnecting(false);
      setIsCheckingPassword(false);

      console.log('✅ Auto-connected successfully');
    } catch (error) {
      console.error('Auto-connect failed:', error);
      setConnecting(false);
      setIsCheckingPassword(false);
      setNeedsPassword(true);

      Alert.alert(
        '自动连接失败',
        '保存的密码可能已过期，请重新输入密码',
        [{ text: '确定' }]
      );
    }
  };

  const connect = async () => {
    if (!password.trim()) {
      Alert.alert('错误', '请输入密码');
      return;
    }

    if (!device) {
      Alert.alert('错误', '未选择设备');
      return;
    }

    setConnecting(true);

    try {
      const config: SSHConnectionConfig = {
        host: device.meshIP,
        port: device.sshPort,
        username: 'a0000',
        password: password,
      };

      const sessionId = await sshService.connect(device, config);
      setSshSessionId(sessionId);
      setNeedsPassword(false);
      setConnecting(false);

      // 保存密码到安全存储
      try {
        const { getKeyStorageService } = await import('../services/keyStorageService');
        const keyStorage = getKeyStorageService();
        await keyStorage.storePassword(device.id, password);
        console.log('✅ Password saved for device:', device.id);
      } catch (error) {
        console.error('Failed to save password:', error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '连接失败';
      setConnecting(false);
      Alert.alert('连接失败', errorMessage, [{ text: '确定' }]);
    }
  };

  const disconnect = async () => {
    if (sshSessionId) {
      try {
        await sshService.disconnect(sshSessionId);
        setSshSessionId(null);
        console.log('✅ Disconnected from device');
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  };

  const reset = () => {
    setSshSessionId(null);
    setNeedsPassword(false);
    setPassword('');
    setIsCheckingPassword(true);
  };

  return {
    needsPassword,
    password,
    setPassword,
    connecting,
    sshSessionId,
    isCheckingPassword,
    connect,
    disconnect,
    reset,
  };
};
