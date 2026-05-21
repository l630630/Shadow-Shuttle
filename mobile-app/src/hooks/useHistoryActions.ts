/**
 * useHistoryActions Hook
 * 历史记录操作 Hook
 * 
 * 处理历史记录的各种操作：重新执行、收藏、删除等
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { commandHistoryStore } from '../stores/commandHistoryStore';
import { commandFavoriteStore } from '../stores/commandFavoriteStore';
import { HistoryEntry } from '../types/nlc';

interface UseHistoryActionsProps {
  navigation: any;
  onHistoryChange?: () => void;
}

export const useHistoryActions = ({ navigation, onHistoryChange }: UseHistoryActionsProps) => {
  /**
   * 重新执行命令
   */
  const reExecuteCommand = useCallback((entry: HistoryEntry) => {
    Alert.alert(
      '重新执行',
      `确定要重新执行命令吗？\n\n${entry.parsedCommand}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '执行',
          onPress: () => {
            // Navigate to AI Chat or Terminal with pre-filled command
            navigation.navigate('AIChat', {
              deviceId: entry.deviceId,
              prefilledCommand: entry.parsedCommand,
            });
          },
        },
      ]
    );
  }, [navigation]);

  /**
   * 添加命令到收藏
   */
  const addToFavorites = useCallback(async (entry: HistoryEntry) => {
    try {
      await commandFavoriteStore.addFavorite({
        id: `fav-${Date.now()}`,
        name: entry.userInput || entry.parsedCommand,
        description: `从历史记录添加 - ${new Date(entry.timestamp).toLocaleString('zh-CN')}`,
        command: entry.parsedCommand,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        tags: [],
      });
      
      Alert.alert('成功', '已添加到收藏');
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      Alert.alert('错误', '添加到收藏失败');
    }
  }, []);

  /**
   * 删除历史记录
   */
  const deleteEntry = useCallback(async (entry: HistoryEntry) => {
    Alert.alert(
      '删除记录',
      '确定要删除这条历史记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await commandHistoryStore.deleteEntry(entry.id);
              onHistoryChange?.();
              Alert.alert('成功', '已删除历史记录');
            } catch (error) {
              console.error('Failed to delete entry:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  }, [onHistoryChange]);

  /**
   * 清空所有历史
   */
  const clearAllHistory = useCallback(async () => {
    Alert.alert(
      '清空历史',
      '确定要清空所有历史记录吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: async () => {
            try {
              await commandHistoryStore.clearHistory();
              onHistoryChange?.();
              Alert.alert('成功', '已清空历史记录');
            } catch (error) {
              console.error('Failed to clear history:', error);
              Alert.alert('错误', '清空失败');
            }
          },
        },
      ]
    );
  }, [onHistoryChange]);

  return {
    reExecuteCommand,
    addToFavorites,
    deleteEntry,
    clearAllHistory,
  };
};
