/**
 * Logo Component - Shadow Shuttle Logo
 * 使用 Material Icons 的 webhook 图标
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../styles/theme';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
  iconColor?: string;
  containerColor?: string;
  showGlow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 40,
  style,
  iconColor = colors.primary,
  containerColor = '#0f141e',
  showGlow = true,
}) => {
  const iconSize = size * 0.6; // Icon is 60% of container size

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Glow effect */}
      {showGlow && (
        <View
          style={[
            styles.glow,
            {
              width: size,
              height: size,
              borderRadius: size * 0.4,
            },
          ]}
        />
      )}
      
      {/* Icon container */}
      <View
        style={[
          styles.iconContainer,
          {
            width: size,
            height: size,
            borderRadius: size * 0.4,
            backgroundColor: containerColor,
          },
        ]}
      >
        <Icon name="webhook" size={iconSize} color={iconColor} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: `${colors.primary}30`,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
