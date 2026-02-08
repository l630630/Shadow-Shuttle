/**
 * Command Favorites Screen
 * Displays and manages favorite commands
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Header } from '../components/Header';
import { commandFavoriteStore } from '../stores/commandFavoriteStore';
import { colors, typography, spacing, borderRadius, shadows, getThemeColors } from '../styles/theme';

interface CommandFavoritesScreenProps {
  navigation: any;
}

export const CommandFavoritesScreen: React.FC<CommandFavoritesScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCommand, setNewCommand] = useState({ name: '', command: '', description: '' });
  const [favorites, setFavorites] = useState<any[]>([]);
  const isDarkMode = true; // 强制 Dark 模式
  const themeColors = getThemeColors(isDarkMode);

  // Load favorites on mount
  React.useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const data = await commandFavoriteStore.getFavorites();
    setFavorites(data);
  };

  const filteredFavorites = favorites.filter((fav: any) =>
    fav.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fav.command.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFavorite = async () => {
    if (!newCommand.name.trim() || !newCommand.command.trim()) {
      Alert.alert('错误', '请填写命令名称和命令内容');
      return;
    }

    try {
      await commandFavoriteStore.addFavorite({
        id: Date.now().toString(),
        name: newCommand.name.trim(),
        command: newCommand.command.trim(),
        description: newCommand.description.trim(),
        tags: [],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setNewCommand({ name: '', command: '', description: '' });
      setShowAddModal(false);
      loadFavorites();
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '添加失败');
    }
  };

  const handleDeleteFavorite = (id: string, name: string) => {
    Alert.alert(
      '删除收藏',
      `确定要删除 "${name}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await commandFavoriteStore.deleteFavorite(id);
            loadFavorites();
          },
        },
      ]
    );
  };

  const handleExecuteFavorite = async (command: string, id: string) => {
    const favorite = favorites.find((f: any) => f.id === id);
    if (favorite) {
      await commandFavoriteStore.updateFavorite(id, { 
        usageCount: (favorite.usageCount || 0) + 1 
      });
      loadFavorites();
    }
    // Navigate to terminal or AI chat to execute
    navigation.navigate('Terminal', { command });
  };

  const renderFavoriteItem = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.favoriteCard, { backgroundColor: themeColors.surface }]}
      onPress={() => handleExecuteFavorite(item.command, item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.favoriteHeader}>
        <View style={styles.favoriteIcon}>
          <Icon name="star" size={20} color={colors.warning} />
        </View>
        <View style={styles.favoriteInfo}>
          <Text style={[styles.favoriteName, { color: themeColors.textPrimary }]}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={[styles.favoriteDescription, { color: themeColors.textSecondary }]}>
              {item.description}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteFavorite(item.id, item.name)}
        >
          <Icon name="delete-outline" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.commandBlock, { backgroundColor: themeColors.background }]}>
        <Icon name="terminal" size={16} color={colors.success} style={styles.commandIcon} />
        <Text style={[styles.commandText, { color: colors.success }]} numberOfLines={2}>
          {item.command}
        </Text>
      </View>

      <View style={styles.favoriteFooter}>
        <View style={styles.usageCount}>
          <Icon name="play-arrow" size={14} color={themeColors.textMuted} />
          <Text style={[styles.usageText, { color: themeColors.textMuted }]}>
            使用 {item.usageCount} 次
          </Text>
        </View>
        <Text style={[styles.categoryBadge, { 
          backgroundColor: `${colors.primary}20`,
          color: colors.primary 
        }]}>
          {item.tags.length > 0 ? item.tags[0] : '自定义'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="star-border" size={64} color={themeColors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>
        还没有收藏命令
      </Text>
      <Text style={[styles.emptyDescription, { color: themeColors.textSecondary }]}>
        点击右上角的 + 按钮添加常用命令
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Header
        title="收藏命令"
        subtitle={`${favorites.length} 个命令`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'add',
          onPress: () => setShowAddModal(true),
        }}
      />

      <View style={[styles.searchContainer, { backgroundColor: themeColors.surface }]}>
        <Icon name="search" size={20} color={themeColors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: themeColors.textPrimary }]}
          placeholder="搜索命令..."
          placeholderTextColor={themeColors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredFavorites}
        renderItem={renderFavoriteItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Add Favorite Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
                添加收藏命令
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                  命令名称 *
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: themeColors.background,
                    color: themeColors.textPrimary,
                    borderColor: themeColors.border
                  }]}
                  placeholder="例如：查看系统信息"
                  placeholderTextColor={themeColors.textMuted}
                  value={newCommand.name}
                  onChangeText={text => setNewCommand({ ...newCommand, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                  命令内容 *
                </Text>
                <TextInput
                  style={[styles.input, styles.commandInput, { 
                    backgroundColor: themeColors.background,
                    color: colors.success,
                    borderColor: themeColors.border
                  }]}
                  placeholder="例如：uname -a"
                  placeholderTextColor={themeColors.textMuted}
                  value={newCommand.command}
                  onChangeText={text => setNewCommand({ ...newCommand, command: text })}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                  描述（可选）
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: themeColors.background,
                    color: themeColors.textPrimary,
                    borderColor: themeColors.border
                  }]}
                  placeholder="简短描述这个命令的作用"
                  placeholderTextColor={themeColors.textMuted}
                  value={newCommand.description}
                  onChangeText={text => setNewCommand({ ...newCommand, description: text })}
                  multiline
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: themeColors.background }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: themeColors.textPrimary }]}>
                  取消
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleAddFavorite}
              >
                <Icon name="check" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  添加
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  favoriteCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  favoriteIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.warning}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  favoriteDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  commandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  commandIcon: {
    marginRight: spacing.sm,
  },
  commandText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
  },
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageText: {
    fontSize: typography.fontSize.xs,
    marginLeft: spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  modalBody: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
  },
  commandInput: {
    fontFamily: 'monospace',
    minHeight: 80,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  modalButtonPrimary: {
    ...shadows.md,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
