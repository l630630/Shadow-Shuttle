/**
 * Security Hook
 * 安全设置业务逻辑 Hook
 */

import { useState } from 'react';
import { Alert } from 'react-native';

interface Session {
  id: number;
  device: string;
  location: string;
  isCurrent: boolean;
  icon: string;
  time: string;
}

interface PasswordForm {
  current: string;
  new: string;
  confirm: string;
}

export const useSecurity = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current: '',
    new: '',
    confirm: '',
  });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 1,
      device: 'Chrome on macOS',
      location: 'Shenzhen',
      isCurrent: true,
      icon: 'computer',
      time: '当前设备',
    },
    {
      id: 2,
      device: 'Shadow Shuttle App',
      location: 'Shanghai',
      isCurrent: false,
      icon: 'smartphone',
      time: '2小时前',
    },
    {
      id: 3,
      device: 'Firefox on Windows',
      location: 'Beijing',
      isCurrent: false,
      icon: 'laptop',
      time: '1天前',
    },
  ]);

  const handleChangePassword = () => {
    if (
      !passwordForm.current ||
      !passwordForm.new ||
      passwordForm.new !== passwordForm.confirm
    ) {
      return;
    }

    setPasswordStatus('saving');
    setTimeout(() => {
      setPasswordStatus('success');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordStatus('idle');
        setPasswordForm({ current: '', new: '', confirm: '' });
        Alert.alert('成功', '密码已修改');
      }, 1000);
    }, 1500);
  };

  const handleKickSession = (id: number) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    is2FAEnabled,
    setIs2FAEnabled,
    isChangePasswordOpen,
    setIsChangePasswordOpen,
    passwordForm,
    setPasswordForm,
    passwordStatus,
    sessions,
    handleChangePassword,
    handleKickSession,
  };
};
