/**
 * Action Menu Component
 * 操作菜单组件
 * 
 * Displays action menu for command history entries.
 * 显示命令历史记录的操作菜单。
 * 
 * Requirements: 6.4
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { HistoryEntry } from '../../types/nlc';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * Action Menu Props
 */
interface ActionMenuProps {
  visible: boolean;
  entry: HistoryEntry | null;
  onClose: () => void;
  onReExecute: () => void;
  onAddToFavorites: () => void;
  onViewDetails: () => void;
  onDelete: () => void;
}

/**
 * Action Menu Component
 * 操作菜单组件
 * 
 * Requirement 6.4: Long press to show action menu
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({
  visible,
  entry,
  onClose,
  onReExecute,
  onAddToFavorites,
  onViewDetails,
  onDelete,
}) => {
  const themeColors = useTheme();

  if (!entry) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.content, { backgroundColor: themeColors.surface }]}>
          {/* Re-execute */}
          <TouchableOpacity
            style={[styles.item, { borderBottomColor: themeColors.border }]}
            onPress={onReExecute}
            activeOpacity={0.7}
          >
            <Icon name="refresh" size={20} color={themeColors.textPrimary} style={styles.icon} />
            <Text style={[styles.itemText, { color: themeColors.textPrimary }]}>重新执行</Text>
          </TouchableOpacity>

          {/* Add to Favorites */}
          <TouchableOpacity
            style={[styles.item, { borderBottomColor: themeColors.border }]}
            onPress={onAddToFavorites}
            activeOpacity={0.7}
          >
            <Icon name="star-outline" size={20} color={themeColors.textPrimary} style={styles.icon} />
            <Text style={[styles.itemText, { color: themeColors.textPrimary }]}>添加到收藏</Text>
          </TouchableOpacity>

          {/* View Details */}
          <TouchableOpacity
            style={[styles.item, { borderBottomColor: themeColors.border }]}
            onPress={onViewDetails}
            activeOpacity={0.7}
          >
            <Icon name="info-outline" size={20} color={themeColors.textPrimary} style={styles.icon} />
            <Text style={[styles.itemText, { color: themeColors.textPrimary }]}>查看详情</Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            style={[styles.item, styles.itemDanger, { borderBottomColor: colors.status.error + '20' }]}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Icon name="delete-outline" size={20} color={colors.status.error} style={styles.icon} />
            <Text style={[styles.itemText, styles.itemTextDanger]}>
              删除
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            style={[styles.item, styles.itemCancel]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.itemText, { color: themeColors.textPrimary, textAlign: 'center' }]}>取消</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderRadius: borderRadius.xl,
    width: '80%',
    maxWidth: 300,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
  },
  itemDanger: {
    // borderBottomColor set dynamically
  },
  itemCancel: {
    borderBottomWidth: 0,
  },
  icon: {
    marginRight: spacing.sm,
  },
  itemText: {
    fontSize: typography.fontSize.base,
  },
  itemTextDanger: {
    color: colors.status.error,
  },
});
