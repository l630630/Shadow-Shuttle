/**
 * User Bubble Component
 * 用户消息气泡组件
 * 
 * Displays user messages with avatar and timestamp.
 * 显示用户消息，包含头像和时间戳。
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Message } from '../../types/nlc';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * User Bubble Props
 */
interface UserBubbleProps {
  message: Message;
}

/**
 * User Bubble Component
 * 用户消息气泡组件
 */
export const UserBubble: React.FC<UserBubbleProps> = ({ message }) => {
  const themeColors = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, { backgroundColor: colors.primary }]}>
        {/* Image if present */}
        {message.image && (
          <View style={styles.imageContainer}>
            <Text style={[styles.imageText, { color: 'rgba(255, 255, 255, 0.7)' }]}>
              [图片]
            </Text>
          </View>
        )}

        {/* Message Text */}
        <Text style={styles.messageText}>{message.content}</Text>

        {/* Timestamp */}
        <Text style={styles.timestamp}>
          你 • {message.timestamp.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* User Avatar */}
      <View style={styles.avatar}>
        <Icon name="person" size={18} color="#FFFFFF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderTopRightRadius: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    marginBottom: spacing.sm,
  },
  imageText: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
