/**
 * Command Preview Component
 * 命令预览组件
 * 
 * Displays a terminal-style command preview with macOS-style window controls.
 * 显示终端风格的命令预览，带有 macOS 风格的窗口控制。
 */

import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Message } from '../../types/nlc';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * Command Preview Props
 */
interface CommandPreviewProps {
  message: Message;
}

/**
 * Command Preview Component
 * 命令预览组件
 */
export const CommandPreview: React.FC<CommandPreviewProps> = ({ message }) => {
  const themeColors = useTheme();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <View style={[
        styles.preview,
        { 
          backgroundColor: themeColors.surfaceDarker,
          borderColor: themeColors.border,
        }
      ]}>
        {/* Header */}
        <View style={[
          styles.header,
          { 
            backgroundColor: isDarkMode ? '#1a2130' : '#F5F5F5',
            borderBottomColor: themeColors.border,
          }
        ]}>
          <View style={styles.headerLeft}>
            <Icon name="terminal" size={16} color={themeColors.textMuted} />
            <Text style={[styles.label, { color: themeColors.textMuted }]}>
              命令预览
            </Text>
          </View>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
            <View style={[styles.dot, { backgroundColor: '#FFC107' }]} />
            <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
          </View>
        </View>

        {/* Command */}
        <View style={styles.body}>
          <Text style={[styles.prompt, { color: colors.status.success }]}>
            root@device:~#
          </Text>
          <Text style={[styles.commandText, { color: themeColors.textPrimary }]}>
            {message.content}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: 44,
    paddingRight: spacing.sm,
    marginBottom: spacing.lg,
  },
  preview: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  body: {
    padding: spacing.lg,
  },
  prompt: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  commandText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono,
  },
});
