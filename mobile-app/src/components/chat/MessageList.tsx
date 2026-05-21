/**
 * 消息列表组件
 * 显示聊天消息和空状态
 */

import React, { useRef, useEffect } from 'react';
import { FlatList, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { Message } from '../../types/nlc';
import { ChatBubble } from '../ChatBubble';
import { EmptyState } from '../EmptyState';
import { spacing, colors } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface MessageListProps {
  messages: Message[];
  isProcessing?: boolean;
  onExecuteCommand: (command: string, messageId: string) => void;
  onCancelCommand: (messageId: string) => void;
  onAgentStop: (messageId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isProcessing = false,
  onExecuteCommand,
  onCancelCommand,
  onAgentStop,
}) => {
  const themeColors = useTheme();
  const flatListRef = useRef<FlatList>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble
      message={item}
      onExecuteCommand={onExecuteCommand}
      onCancelCommand={onCancelCommand}
      onAgentStop={onAgentStop}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <EmptyState
            icon="smart-toy"
            title="👋 你好！我是 AI 助手"
            description="用自然语言告诉我你想做什么，我会帮你生成命令"
          />
        }
      />

      {/* 处理中指示器 */}
      {isProcessing && (
        <View style={[styles.processingContainer, { backgroundColor: themeColors.surface }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.processingText, { color: themeColors.textSecondary }]}>
            思考中...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  processingText: {
    marginLeft: spacing.sm,
    fontSize: 14,
  },
});
