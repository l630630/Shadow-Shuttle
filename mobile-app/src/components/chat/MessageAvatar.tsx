/**
 * Message Avatar Component
 * 消息头像组件
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface MessageAvatarProps {
  type: 'user' | 'ai';
}

export const MessageAvatar: React.FC<MessageAvatarProps> = ({ type }) => {
  const isUser = type === 'user';

  return (
    <View style={[styles.avatar, isUser ? styles.userAvatar : styles.aiAvatar]}>
      <Icon 
        name={isUser ? 'person' : 'smart-toy'} 
        size={18} 
        color="#FFFFFF" 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatar: {
    backgroundColor: '#667eea', // Gradient approximation
  },
  userAvatar: {
    backgroundColor: '#64748B',
  },
});
