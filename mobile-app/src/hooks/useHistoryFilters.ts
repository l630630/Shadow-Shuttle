/**
 * useHistoryFilters Hook
 * 历史记录筛选 Hook
 * 
 * 处理历史记录的筛选逻辑
 * Requirement 6.5: Filter by device, time range, dangerous flag, and search
 */

import { useState, useMemo } from 'react';
import { HistoryEntry } from '../types/nlc';

export type TimeRange = 'all' | 'today' | 'week' | 'month' | 'custom';

export const useHistoryFilters = (history: HistoryEntry[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [showDangerousOnly, setShowDangerousOnly] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  /**
   * 应用所有筛选条件
   */
  const filteredHistory = useMemo(() => {
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

    return filtered;
  }, [
    history,
    selectedDeviceId,
    timeRange,
    customStartDate,
    customEndDate,
    showDangerousOnly,
    searchQuery,
  ]);

  /**
   * 重置所有筛选条件
   */
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDeviceId(undefined);
    setTimeRange('all');
    setShowDangerousOnly(false);
    setCustomStartDate(null);
    setCustomEndDate(null);
  };

  /**
   * 检查是否有活动的筛选条件
   */
  const hasActiveFilters = selectedDeviceId || showDangerousOnly || timeRange !== 'all';

  return {
    // State
    searchQuery,
    selectedDeviceId,
    showDangerousOnly,
    timeRange,
    customStartDate,
    customEndDate,
    
    // Setters
    setSearchQuery,
    setSelectedDeviceId,
    setShowDangerousOnly,
    setTimeRange,
    setCustomStartDate,
    setCustomEndDate,
    
    // Computed
    filteredHistory,
    hasActiveFilters,
    
    // Actions
    resetFilters,
  };
};
