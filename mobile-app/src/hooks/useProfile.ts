/**
 * Profile Hook
 * 个人中心业务逻辑 Hook
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../stores/authStore';

type ProfileView = 'main' | 'app_settings' | 'account' | 'security';

export const useProfile = () => {
  const [profileView, setProfileView] = useState<ProfileView>('main');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [privacyShieldEnabled, setPrivacyShieldEnabled] = useState(true);
  const [dataAnonymization, setDataAnonymization] = useState(true);
  const [email, setEmail] = useState('admin@shadowshuttle.io');
  const [bio, setBio] = useState('Senior Systems Architect.');

  const { logout, username } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？本地数据将会保留。', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          setTimeout(async () => {
            try {
              await logout();
              setIsLoggingOut(false);
            } catch (error) {
              console.error('Logout error:', error);
              setIsLoggingOut(false);
              Alert.alert('错误', '退出登录失败，请重试');
            }
          }, 1500);
        },
      },
    ]);
  };

  const handleSaveAccount = () => {
    Alert.alert('成功', '账户信息已保存');
    setProfileView('main');
  };

  return {
    profileView,
    setProfileView,
    isLoggingOut,
    privacyShieldEnabled,
    setPrivacyShieldEnabled,
    dataAnonymization,
    setDataAnonymization,
    email,
    setEmail,
    bio,
    setBio,
    username: username || 'SysAdmin',
    handleLogout,
    handleSaveAccount,
  };
};
