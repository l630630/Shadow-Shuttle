/**
 * 命令建议栏组件
 * 显示 AI 生成的命令建议
 */

import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Suggestion } from '../../types/nlc';
import { spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface SuggestionBarProps {
  suggestions: Suggestion[];
  visible: boolean;
  onSelect: (suggestion: Suggestion) => void;
}

export const SuggestionBar: React.FC<SuggestionBarProps> = ({
  suggestions,
  visible,
  onSelect,
}) => {
  const themeColors = useTheme();

  if (!visible || suggestions.length === 0) {
    return null;
  }

  const renderSuggestion = ({ item }: { item: Suggestion }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        {
          backgroundColor: themeColors.surfaceDarker,
          borderColor: themeColors.border,
        },
      ]}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.suggestionCommand, { color: themeColors.textPrimary }]}>
        {item.command}
      </Text>
      <Text style={[styles.suggestionDescription, { color: themeColors.textSecondary }]}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
        },
      ]}
    >
      <FlatList
        data={suggestions}
        renderItem={renderSuggestion}
        keyExtractor={(_, index) => `suggestion-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  suggestionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minWidth: 150,
    maxWidth: 250,
  },
  suggestionCommand: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});
