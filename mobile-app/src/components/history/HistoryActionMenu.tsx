/**
 * History Action Menu Component
 * 历史记录操作菜单组件
 * 
 * 长按历史项时显示的操作菜单
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { HistoryEntry } from '../../types/nlc';
import { colors, typography, spacing, borderRadius } from '../../styles/theme';
import { useTheme } from '../../hooks/useTheme';

interface HistoryActionMenuProps {
  visible: boolean;
  entry: HistoryEntry | null;
  onClose: () => void;
  onReExecute: (entry: HistoryEntry) => void;
  onAddToFavorites: (entry: HistoryEntry) => void;
  onViewDetails: (entry: HistoryEntry) => void;
  onDelete: (entry: HistoryEntry) => void;
}

export const HistoryActionMenu: React.FC<HistoryActionMenuProps> = ({
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
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: themeColors.border }]}
            onPress={() => {
              onClose();
              onReExecute(entry);
            }}
            activeOpacity={0.7}
          >
            <Icon name="refresh" size={20} color={themeColors.textPrimary} />
            <Text style={[styles.menuItemText, { color: themeColors.textPrimary }]}>
              重新执行
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: themeColors.border }]}
            onPress={() => {
              onClose();
              onAddToFavorites(entry);
            }}
            activeOpacity={0.7}
          >
            <Icon name="star-outline" size={20} color={themeColors.textPrimary} />
            <Text style={[styles.menuItemText, { color: themeColors.textPrimary }]}>
              添加到收藏
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: themeColors.border }]}
            onPress={() => {
              onClose();
              onViewDetails(entry);
            }}
            activeOpacity={0.7}
          >
            <Icon name="info-outline" size={20} color={themeColors.textPrimary} />
            <Text style={[styles.menuItemText, { color: themeColors.textPrimary }]}>
              查看详情
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuItem,
              styles.menuItemDanger,
              { borderBottomColor: colors.status.error + '20' }
            ]}
            onPress={() => {
              onClose();
              onDelete(entry);
            }}
            activeOpacity={0.7}
          >
            <Icon name="delete-outline" size={20} color={colors.status.error} />
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
              删除
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemCancel]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.menuItemText, { color: themeColors.textPrimary }]}>
              取消
            </Text>
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  menuItemDanger: {
    // borderBottomColor set dynamically
  },
  menuItemCancel: {
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: typography.fontSize.base,
  },
  menuItemTextDanger: {
    color: colors.status.error,
  },
});
