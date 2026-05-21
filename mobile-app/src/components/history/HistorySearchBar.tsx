/**
 * History Search Bar Component
 * 历史记录搜索栏组件
 * 
 * 搜索输入框和筛选按钮
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface HistorySearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterPress: () => void;
  hasActiveFilters: boolean;
}

export const HistorySearchBar: React.FC<HistorySearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onFilterPress,
  hasActiveFilters,
}) => {
  const themeColors = useTheme();

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: themeColors.surface,
        borderBottomColor: themeColors.border,
      }
    ]}>
      <View style={[styles.searchInputContainer, { backgroundColor: themeColors.background }]}>
        <Icon name="search" size={20} color={themeColors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: themeColors.textPrimary }]}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="搜索命令..."
          placeholderTextColor={themeColors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Icon name="close" size={20} color={themeColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.filterButton,
          { 
            backgroundColor: hasActiveFilters 
              ? colors.primary 
              : themeColors.surfaceDarker 
          }
        ]}
        onPress={onFilterPress}
        activeOpacity={0.7}
      >
        <Icon 
          name="filter-list" 
          size={20} 
          color={hasActiveFilters ? '#FFFFFF' : themeColors.textPrimary} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: typography.fontSize.sm,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
