/**
 * History List Component
 * 历史记录列表组件
 * 
 * Displays a list of command history entries with loading and empty states.
 * 显示命令历史记录列表，包含加载和空状态。
 * 
 * Requirements: 6.2
 */

import React from 'react';
import { FlatList, ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HistoryEntry } from '../../types/nlc';
import { HistoryItem } from './HistoryItem';
import { EmptyState } from '../EmptyState';
import { colors, typography, spacing } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * History List Props
 */
interface HistoryListProps {
  history: HistoryEntry[];
  loading: boolean;
  hasFilters: boolean;
  getDeviceName: (entry: HistoryEntry) => string;
  onItemPress: (entry: HistoryEntry) => void;
  onItemLongPress: (entry: HistoryEntry) => void;
  onClearFilters: () => void;
}

/**
 * History List Component
 * 历史记录列表组件
 * 
 * Requirement 6.2: Display history in reverse chronological order
 */
export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  loading,
  hasFilters,
  getDeviceName,
  onItemPress,
  onItemLongPress,
  onClearFilters,
}) => {
  const themeColors = useTheme();

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          加载中...
        </Text>
      </View>
    );
  }

  // Empty state
  if (history.length === 0) {
    return (
      <EmptyState
        icon="history"
        title={hasFilters ? '没有找到匹配的历史记录' : '还没有命令历史'}
        action={hasFilters ? (
          <TouchableOpacity
            style={[styles.clearFilterButton, { backgroundColor: colors.primary }]}
            onPress={onClearFilters}
          >
            <Text style={styles.clearFilterText}>清除筛选</Text>
          </TouchableOpacity>
        ) : undefined}
      />
    );
  }

  // History list
  return (
    <FlatList
      data={history}
      renderItem={({ item }) => (
        <HistoryItem
          entry={item}
          deviceName={getDeviceName(item)}
          onPress={() => onItemPress(item)}
          onLongPress={() => onItemLongPress(item)}
        />
      )}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
  },
  clearFilterButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  clearFilterText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  listContent: {
    padding: spacing.lg,
  },
});
