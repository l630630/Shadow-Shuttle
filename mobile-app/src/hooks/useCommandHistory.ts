/**
 * Command History Hook
 * 命令历史管理 Hook
 * 
 * Manages command history state, filtering, and operations.
 * 管理命令历史状态、筛选和操作。
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */

import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { commandHistoryStore } from '../stores/commandHistoryStore';
import { commandFavoriteStore } from '../stores/commandFavoriteStore';
import { HistoryEntry, HistoryFilter } from '../types/nlc';

/**
 * Time range options
 * 时间范围选项
 */
export type TimeRange = 'all' | 'today' | 'week' | 'month' | 'custom';

/**
 * Command History Hook Return Type
 */
export interface UseCommandHistoryReturn {
  // State
  history: HistoryEntry[];
  filteredHistory: HistoryEntry[];
  loading: boolean;
  searchQuery: string;
  selectedDeviceId: string | undefined;
  showDangerousOnly: boolean;
  timeRange: TimeRange;
  customStartDate: Date | null;
  customEndDate: Date | null;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedDeviceId: (deviceId: string | undefined) => void;
  setShowDangerousOnly: (show: boolean) => void;
  setTimeRange: (range: TimeRange) => void;
  setCustomStartDate: (date: Date | null) => void;
  setCustomEndDate: (date: Date | null) => void;
  loadHistory: () => Promise<void>;
  deleteEntry: (entry: HistoryEntry) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  addToFavorites: (entry: HistoryEntry) => Promise<void>;
  resetFilters: () => void;
}

/**
 * Command History Hook
 * 命令历史 Hook
 * 
 * @returns Command history state and actions
 */
export const useCommandHistory = (): UseCommandHistoryReturn => {
  // State
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [showDangerousOnly, setShowDangerousOnly] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Apply filters when history or filter changes
  useEffect(() => {
    applyFilters();
  }, [history, searchQuery, selectedDeviceId, showDangerousOnly, timeRange, customStartDate, customEndDate]);

  /**
   * Load command history
   * 加载命令历史
   * 
   * Requirement 6.2: Display in reverse chronological order
   */
  const loadHistory = async () => {
    setLoading(true);
    try {
      const entries = await commandHistoryStore.getHistory();
      setHistory(entries);
    } catch (error) {
      console.error('Failed to load history:', error);
      Alert.alert('错误', '加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply filters to history
   * 应用筛选条件
   * 
   * Requirement 6.5: Filter by device, time range, dangerous flag, and search
   */
  const applyFilters = () => {
    let filtered = [...history];

    // Filter by device
    if (selectedDeviceId) {
      filtered = filtered.filter(entry => entry.deviceId === selectedDeviceId);
    }

    // Filter by time range
    if (timeRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'custom':
          if (customStartDate) {
            startDate = customStartDate;
            const endDate = customEndDate || now;
            filtered = filtered.filter(entry => {
              const entryDate = new Date(entry.timestamp);
              return entryDate >= startDate && entryDate <= endDate;
            });
          }
          break;
      }

      if (timeRange !== 'custom') {
        filtered = filtered.filter(entry => new Date(entry.timestamp) >= startDate);
      }
    }

    // Filter by dangerous flag
    if (showDangerousOnly) {
      filtered = filtered.filter(entry => entry.isDangerous);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.userInput.toLowerCase().includes(query) ||
        entry.parsedCommand.toLowerCase().includes(query) ||
        entry.output.toLowerCase().includes(query)
      );
    }

    setFilteredHistory(filtered);
  };

  /**
   * Delete history entry
   * 删除历史记录
   */
  const deleteEntry = async (entry: HistoryEntry) => {
    return new Promise<void>((resolve, reject) => {
      Alert.alert(
        '删除记录',
        '确定要删除这条历史记录吗？',
        [
          { text: '取消', style: 'cancel', onPress: () => reject() },
          {
            text: '删除',
            style: 'destructive',
            onPress: async () => {
              try {
                await commandHistoryStore.deleteEntry(entry.id);
                await loadHistory();
                Alert.alert('成功', '已删除历史记录');
                resolve();
              } catch (error) {
                console.error('Failed to delete entry:', error);
                Alert.alert('错误', '删除失败');
                reject(error);
              }
            },
          },
        ]
      );
    });
  };

  /**
   * Clear all history
   * 清空所有历史
   */
  const clearAllHistory = async () => {
    return new Promise<void>((resolve, reject) => {
      Alert.alert(
        '清空历史',
        '确定要清空所有历史记录吗？此操作不可恢复。',
        [
          { text: '取消', style: 'cancel', onPress: () => reject() },
          {
            text: '清空',
            style: 'destructive',
            onPress: async () => {
              try {
                await commandHistoryStore.clearHistory();
                await loadHistory();
                Alert.alert('成功', '已清空历史记录');
                resolve();
              } catch (error) {
                console.error('Failed to clear history:', error);
                Alert.alert('错误', '清空失败');
                reject(error);
              }
            },
          },
        ]
      );
    });
  };

  /**
   * Add command to favorites
   * 添加命令到收藏
   */
  const addToFavorites = async (entry: HistoryEntry) => {
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
      throw error;
    }
  };

  /**
   * Reset all filters
   * 重置所有筛选条件
   */
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDeviceId(undefined);
    setShowDangerousOnly(false);
    setTimeRange('all');
    setCustomStartDate(null);
    setCustomEndDate(null);
  };

  return {
    // State
    history,
    filteredHistory,
    loading,
    searchQuery,
    selectedDeviceId,
    showDangerousOnly,
    timeRange,
    customStartDate,
    customEndDate,
    
    // Actions
    setSearchQuery,
    setSelectedDeviceId,
    setShowDangerousOnly,
    setTimeRange,
    setCustomStartDate,
    setCustomEndDate,
    loadHistory,
    deleteEntry,
    clearAllHistory,
    addToFavorites,
    resetFilters,
  };
};
