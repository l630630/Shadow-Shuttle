/**
 * Command History Screen
 * 命令历史界面
 * 
 * Displays command execution history with filtering and search capabilities.
 * Supports viewing details, re-executing, favoriting, and deleting commands.
 * 
 * 显示命令执行历史，支持筛选和搜索功能。
 * 支持查看详情、重新执行、收藏和删除命令。
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  useColorScheme,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { commandHistoryStore } from '../stores/commandHistoryStore';
import { commandFavoriteStore } from '../stores/commandFavoriteStore';
import { useDeviceStore } from '../stores/deviceStore';
import { HistoryEntry, HistoryFilter } from '../types/nlc';
import { Header } from '../components/Header';
import { colors, typography, spacing, borderRadius, shadows, getThemeColors } from '../styles/theme';

/**
 * Command History Screen Props
 */
interface CommandHistoryScreenProps {
  navigation: any;
}

/**
 * Command History Screen Component
 * 命令历史界面组件
 * 
 * Requirement 6.2: Display history in reverse chronological order
 * Requirement 6.3: View command details on click
 * Requirement 6.4: Long press to show action menu
 * Requirement 6.5: Filter by device, time range, and search
 */
export const CommandHistoryScreen: React.FC<CommandHistoryScreenProps> = ({ navigation }) => {
  const isDarkMode = true; // 强制 Dark 模式
  const themeColors = getThemeColors(isDarkMode);
  
  // State
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionMenuEntry, setActionMenuEntry] = useState<HistoryEntry | null>(null);
  
  // Filter state
  const [filter, setFilter] = useState<HistoryFilter>({});
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [showDangerousOnly, setShowDangerousOnly] = useState(false);
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  
  // Device store
  const { devices } = useDeviceStore();

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Apply filters when history or filter changes
  useEffect(() => {
    applyFilters();
  }, [history, filter, searchQuery, showDangerousOnly, timeRange, customStartDate, customEndDate]);

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
   * Show entry details
   * 显示条目详情
   * 
   * Requirement 6.3: Click to view details
   */
  const showDetails = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  /**
   * Show action menu
   * 显示操作菜单
   * 
   * Requirement 6.4: Long press to show action menu
   */
  const showActions = (entry: HistoryEntry) => {
    setActionMenuEntry(entry);
    setShowActionMenu(true);
  };

  /**
   * Re-execute command
   * 重新执行命令
   */
  const reExecuteCommand = (entry: HistoryEntry) => {
    setShowActionMenu(false);
    
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
  };

  /**
   * Add command to favorites
   * 添加命令到收藏
   */
  const addToFavorites = async (entry: HistoryEntry) => {
    setShowActionMenu(false);
    
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
  };

  /**
   * Delete history entry
   * 删除历史记录
   */
  const deleteEntry = async (entry: HistoryEntry) => {
    setShowActionMenu(false);
    
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
              await loadHistory();
              Alert.alert('成功', '已删除历史记录');
            } catch (error) {
              console.error('Failed to delete entry:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  /**
   * Clear all history
   * 清空所有历史
   */
  const clearAllHistory = () => {
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
              await loadHistory();
              Alert.alert('成功', '已清空历史记录');
            } catch (error) {
              console.error('Failed to clear history:', error);
              Alert.alert('错误', '清空失败');
            }
          },
        },
      ]
    );
  };

  /**
   * Format timestamp
   * 格式化时间戳
   */
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get device name by ID or from entry
   * 根据 ID 获取设备名称或从记录中获取
   */
  const getDeviceName = (entry: HistoryEntry): string => {
    // First try to use deviceName from the entry itself
    if (entry.deviceName) {
      return entry.deviceName;
    }
    
    // Fallback to looking up by deviceId
    const device = devices.find(d => d.id === entry.deviceId);
    return device?.name || '未知设备';
  };

  /**
   * Render history item
   * 渲染历史项
   */
  const renderHistoryItem = ({ item }: { item: HistoryEntry }) => (
    <TouchableOpacity
      style={[
        styles.historyItem,
        { 
          backgroundColor: themeColors.surface,
          borderColor: item.isDangerous ? colors.status.error : themeColors.border,
        },
        item.isDangerous && styles.historyItemDangerous,
        shadows.sm,
      ]}
      onPress={() => showDetails(item)}
      onLongPress={() => showActions(item)}
      activeOpacity={0.7}
    >
      <View style={styles.historyHeader}>
        <View style={styles.deviceRow}>
          <Icon name="computer" size={16} color={themeColors.textSecondary} />
          <Text style={[styles.deviceName, { color: themeColors.textPrimary }]}>
            {getDeviceName(item)}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: themeColors.textMuted }]}>
          {formatTimestamp(new Date(item.timestamp))}
        </Text>
      </View>

      {item.userInput && (
        <Text style={[styles.userInput, { color: themeColors.textSecondary }]} numberOfLines={1}>
          {item.userInput}
        </Text>
      )}

      <View style={styles.commandContainer}>
        <Text style={[styles.commandText, { color: themeColors.textPrimary }]} numberOfLines={1}>
          $ {item.parsedCommand}
        </Text>
        {item.isDangerous && (
          <Icon name="warning" size={18} color={colors.status.error} />
        )}
      </View>

      <View style={styles.statusRow}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.exitCode === 0 ? colors.status.success + '20' : colors.status.error + '20' },
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.exitCode === 0 ? colors.status.success : colors.status.error }
          ]}>
            {item.exitCode === 0 ? '成功' : `失败 (${item.exitCode})`}
          </Text>
        </View>
        <Text style={[styles.executionTime, { color: themeColors.textMuted }]}>
          {item.executionTime}ms
        </Text>
      </View>
    </TouchableOpacity>
  );

  /**
   * Render detail modal
   * 渲染详情模态框
   */
  const renderDetailModal = () => {
    if (!selectedEntry) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
                命令详情
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={[styles.closeButton, { color: themeColors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>设备</Text>
                <Text style={[styles.detailValue, { color: themeColors.textPrimary }]}>
                  {getDeviceName(selectedEntry)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>时间</Text>
                <Text style={[styles.detailValue, { color: themeColors.textPrimary }]}>
                  {new Date(selectedEntry.timestamp).toLocaleString('zh-CN')}
                </Text>
              </View>

              {selectedEntry.userInput && (
                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>用户输入</Text>
                  <Text style={[styles.detailValue, { color: themeColors.textPrimary }]}>
                    {selectedEntry.userInput}
                  </Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>命令</Text>
                <View style={[styles.codeBlock, { backgroundColor: themeColors.surfaceDarker }]}>
                  <Text style={[styles.codeText, { color: themeColors.textPrimary }]}>
                    {selectedEntry.parsedCommand}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>输出</Text>
                <ScrollView style={[styles.outputBlock, { backgroundColor: themeColors.surfaceDarker }]}>
                  <Text style={[styles.outputText, { color: themeColors.textPrimary }]}>
                    {selectedEntry.output || '(无输出)'}
                  </Text>
                </ScrollView>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>状态</Text>
                <View style={styles.statusRow}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: selectedEntry.exitCode === 0 ? colors.status.success + '20' : colors.status.error + '20' },
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: selectedEntry.exitCode === 0 ? colors.status.success : colors.status.error }
                    ]}>
                      退出码: {selectedEntry.exitCode}
                    </Text>
                  </View>
                  <Text style={[styles.executionTime, { color: themeColors.textMuted }]}>
                    执行时间: {selectedEntry.executionTime}ms
                  </Text>
                </View>
              </View>

              {selectedEntry.isDangerous && (
                <View style={[styles.warningSection, { backgroundColor: colors.status.warning + '20' }]}>
                  <Text style={[styles.warningText, { color: colors.status.warning }]}>
                    ⚠️ 此命令被标记为危险命令
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalActions, { borderTopColor: themeColors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, shadows.sm]}
                onPress={() => {
                  setShowDetailModal(false);
                  reExecuteCommand(selectedEntry);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>重新执行</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: themeColors.surfaceDarker }]}
                onPress={() => setShowDetailModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: themeColors.textPrimary }]}>
                  关闭
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  /**
   * Render filter modal
   * 渲染筛选模态框
   * 
   * Requirement 6.5: Filter by device, time range, dangerous flag
   */
  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
              筛选条件
            </Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={[styles.closeButton, { color: themeColors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Device Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: themeColors.textPrimary }]}>
                设备
              </Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  { backgroundColor: themeColors.surfaceDarker },
                  !selectedDeviceId && styles.filterOptionSelected,
                ]}
                onPress={() => setSelectedDeviceId(undefined)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterOptionText, { color: themeColors.textPrimary }]}>
                  全部设备
                </Text>
                {!selectedDeviceId && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              {devices.map(device => (
                <TouchableOpacity
                  key={device.id}
                  style={[
                    styles.filterOption,
                    { backgroundColor: themeColors.surfaceDarker },
                    selectedDeviceId === device.id && styles.filterOptionSelected,
                  ]}
                  onPress={() => setSelectedDeviceId(device.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterOptionText, { color: themeColors.textPrimary }]}>
                    {device.name}
                  </Text>
                  {selectedDeviceId === device.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* Time Range Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: themeColors.textPrimary }]}>
                时间范围
              </Text>
              {[
                { value: 'all', label: '全部时间' },
                { value: 'today', label: '今天' },
                { value: 'week', label: '最近7天' },
                { value: 'month', label: '本月' },
                { value: 'custom', label: '自定义' },
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    { backgroundColor: themeColors.surfaceDarker },
                    timeRange === option.value && styles.filterOptionSelected,
                  ]}
                  onPress={() => setTimeRange(option.value as any)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterOptionText, { color: themeColors.textPrimary }]}>
                    {option.label}
                  </Text>
                  {timeRange === option.value && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* Dangerous Commands Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: themeColors.textPrimary }]}>
                命令类型
              </Text>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  { backgroundColor: themeColors.surfaceDarker },
                  showDangerousOnly && styles.filterOptionSelected,
                ]}
                onPress={() => setShowDangerousOnly(!showDangerousOnly)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterOptionText, { color: themeColors.textPrimary }]}>
                  只显示危险命令
                </Text>
                {showDangerousOnly && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={[styles.modalActions, { borderTopColor: themeColors.border }]}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: themeColors.surfaceDarker }]}
              onPress={() => {
                // Reset filters
                setSelectedDeviceId(undefined);
                setTimeRange('all');
                setShowDangerousOnly(false);
                setCustomStartDate(null);
                setCustomEndDate(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalButtonText, { color: themeColors.textPrimary }]}>
                重置
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, shadows.sm]}
              onPress={() => setShowFilterModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>应用</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  /**
   * Render action menu modal
   * 渲染操作菜单模态框
   */
  const renderActionMenu = () => {
    if (!actionMenuEntry) return null;

    return (
      <Modal
        visible={showActionMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={[styles.menuContent, { backgroundColor: themeColors.surface }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: themeColors.border }]}
              onPress={() => reExecuteCommand(actionMenuEntry)}
              activeOpacity={0.7}
            >
              <Icon name="refresh" size={20} color={themeColors.textPrimary} style={{ marginRight: spacing.sm }} />
              <Text style={[styles.menuItemText, { color: themeColors.textPrimary }]}>重新执行</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: themeColors.border }]}
              onPress={() => addToFavorites(actionMenuEntry)}
              activeOpacity={0.7}
            >
              <Icon name="star-outline" size={20} color={themeColors.textPrimary} style={{ marginRight: spacing.sm }} />
              <Text style={[styles.menuItemText, { color: themeColors.textPrimary }]}>添加到收藏</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: themeColors.border }]}
              onPress={() => showDetails(actionMenuEntry)}
              activeOpacity={0.7}
            >
              <Icon name="info-outline" size={20} color={themeColors.textPrimary} style={{ marginRight: spacing.sm }} />
              <Text style={[styles.menuItemText, { color: themeColors.textPrimary }]}>查看详情</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger, { borderBottomColor: colors.status.error + '20' }]}
              onPress={() => deleteEntry(actionMenuEntry)}
              activeOpacity={0.7}
            >
              <Icon name="delete-outline" size={20} color={colors.status.error} style={{ marginRight: spacing.sm }} />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                删除
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemCancel]}
              onPress={() => setShowActionMenu(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, { color: themeColors.textPrimary, textAlign: 'center' }]}>取消</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <Header
        title="命令历史"
        subtitle={`共 ${filteredHistory.length} 条记录`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'delete-outline',
          onPress: clearAllHistory,
        }}
      />

      {/* Search and Filter */}
      <View style={[styles.searchContainer, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: themeColors.background }]}>
          <Icon name="search" size={20} color={themeColors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜索命令..."
            placeholderTextColor={themeColors.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color={themeColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: (selectedDeviceId || showDangerousOnly) ? colors.primary : themeColors.surfaceDarker }]}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <Icon 
            name="filter-list" 
            size={20} 
            color={(selectedDeviceId || showDangerousOnly) ? '#FFFFFF' : themeColors.textPrimary} 
          />
        </TouchableOpacity>
      </View>

      {/* History List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            加载中...
          </Text>
        </View>
      ) : filteredHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="history" size={64} color={themeColors.textMuted} />
          <Text style={[styles.emptyText, { color: themeColors.textPrimary }]}>
            {searchQuery || selectedDeviceId || showDangerousOnly
              ? '没有找到匹配的历史记录'
              : '还没有命令历史'}
          </Text>
          {(searchQuery || selectedDeviceId || showDangerousOnly) && (
            <TouchableOpacity
              style={[styles.clearFilterButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setSearchQuery('');
                setSelectedDeviceId(undefined);
                setShowDangerousOnly(false);
              }}
            >
              <Text style={styles.clearFilterText}>清除筛选</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Modals */}
      {renderDetailModal()}
      {renderFilterModal()}
      {renderActionMenu()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
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
  listContent: {
    padding: spacing.lg,
  },
  historyItem: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  historyItemDangerous: {
    // borderLeftColor set dynamically
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deviceName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
  },
  userInput: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  commandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  commandText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  executionTime: {
    fontSize: typography.fontSize.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  clearFilterButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  clearFilterText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  closeButton: {
    fontSize: 24,
  },
  modalBody: {
    padding: spacing.lg,
  },
  detailSection: {
    marginBottom: spacing.lg,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
  },
  codeBlock: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  codeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
  },
  outputBlock: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: 200,
  },
  outputText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'monospace',
  },
  warningSection: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  modalActions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    // backgroundColor set dynamically
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  modalButtonTextSecondary: {
    // color set dynamically
  },
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
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
  },
  menuItemDanger: {
    // borderBottomColor set dynamically
  },
  menuItemCancel: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: typography.fontSize.base,
  },
  menuItemTextDanger: {
    color: colors.status.error,
  },
  // Filter modal styles
  filterSection: {
    marginBottom: spacing.xl,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  filterOptionSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: typography.fontSize.sm,
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
});

export default CommandHistoryScreen;
