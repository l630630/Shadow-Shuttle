/**
 * Bottom Navigation Component
 * 底部导航栏组件
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
import { colors, typography, spacing, layout, getThemeColors } from '../styles/theme';

export type TabId = 'dashboard' | 'ai' | 'history' | 'profile';

interface Tab {
  id: TabId;
  icon: string;
  label: string;
}

interface BottomNavProps {
  currentTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: Tab[] = [
  { id: 'dashboard', icon: 'home', label: '首页' },
  { id: 'ai', icon: 'smart-toy', label: 'AI 助手' },
  { id: 'history', icon: 'history', label: '历史' },
  { id: 'profile', icon: 'person', label: '我的' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const isDarkMode = true; // 强制 Dark 模式
  const themeColors = getThemeColors(isDarkMode);

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isDarkMode 
          ? 'rgba(16, 22, 34, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        borderTopColor: themeColors.border,
      }
    ]}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Icon
              name={tab.icon}
              size={24}
              color={isActive ? colors.primary : themeColors.textMuted}
            />
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.primary : themeColors.textMuted,
                  fontWeight: isActive ? typography.fontWeight.medium : typography.fontWeight.normal,
                }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: layout.bottomNavHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});

export default BottomNav;
