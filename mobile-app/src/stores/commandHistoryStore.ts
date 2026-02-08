/**
 * Command History Store
 * 命令历史存储
 * 
 * Manages command execution history with MMKV for high-performance storage.
 * Implements capacity limits (max 1000 entries) with automatic cleanup.
 * 
 * Requirements: 6.1, 6.2, 6.5, 6.6, 6.7
 */

import { MMKV } from 'react-native-mmkv';
import { HistoryEntry, HistoryFilter } from '../types/nlc';
import { StorageKeys } from '../config/nlc-constants';

// Initialize MMKV storage instance
const storage = new MMKV();

// Maximum number of history entries to keep
const MAX_HISTORY_ENTRIES = 1000;

/**
 * Command History Store Interface
 * 命令历史存储接口
 */
export interface CommandHistoryStore {
  /**
   * Add a new history entry
   * 添加历史记录
   * @param entry History entry to add
   */
  addEntry(entry: HistoryEntry): Promise<void>;

  /**
   * Get history entries with optional filtering
   * 获取历史记录（支持筛选）
   * @param filter Optional filter conditions
   * @param limit Maximum number of entries to return
   * @returns Array of history entries sorted by timestamp (newest first)
   */
  getHistory(filter?: HistoryFilter, limit?: number): Promise<HistoryEntry[]>;

  /**
   * Delete a specific history entry
   * 删除历史记录
   * @param entryId ID of the entry to delete
   */
  deleteEntry(entryId: string): Promise<void>;

  /**
   * Clear all history entries
   * 清空历史记录
   */
  clearHistory(): Promise<void>;

  /**
   * Search history by keyword
   * 搜索历史记录
   * @param query Search keyword
   * @returns Matching history entries
   */
  searchHistory(query: string): Promise<HistoryEntry[]>;
}

/**
 * Command History Store Implementation
 * 命令历史存储实现
 */
class CommandHistoryStoreImpl implements CommandHistoryStore {
  /**
   * Load all history entries from storage
   * 从存储加载所有历史记录
   */
  private loadAllEntries(): HistoryEntry[] {
    try {
      const data = storage.getString(StorageKeys.COMMAND_HISTORY);
      if (!data) {
        return [];
      }

      const entries = JSON.parse(data);
      
      // Convert timestamp strings back to Date objects
      return entries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load history entries:', error);
      return [];
    }
  }

  /**
   * Save all history entries to storage
   * 保存所有历史记录到存储
   */
  private saveAllEntries(entries: HistoryEntry[]): void {
    try {
      storage.set(StorageKeys.COMMAND_HISTORY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save history entries:', error);
      throw new Error('Failed to save history entries');
    }
  }

  /**
   * Enforce capacity limit by removing oldest entries
   * 执行容量限制，删除最旧的条目
   */
  private enforceCapacityLimit(entries: HistoryEntry[]): HistoryEntry[] {
    if (entries.length <= MAX_HISTORY_ENTRIES) {
      return entries;
    }

    // Sort by timestamp descending (newest first)
    const sorted = [...entries].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    // Keep only the newest MAX_HISTORY_ENTRIES entries
    return sorted.slice(0, MAX_HISTORY_ENTRIES);
  }

  /**
   * Add a new history entry
   * 添加历史记录
   * 
   * Requirement 6.1: Save command text, execution time, device info, and execution result
   * Requirement 6.6: Store maximum 1000 entries
   * Requirement 6.7: Automatically delete oldest entries when limit exceeded
   */
  async addEntry(entry: HistoryEntry): Promise<void> {
    const entries = this.loadAllEntries();
    
    // Add new entry
    entries.push(entry);
    
    // Enforce capacity limit (automatically removes oldest if > 1000)
    const limitedEntries = this.enforceCapacityLimit(entries);
    
    // Save to storage
    this.saveAllEntries(limitedEntries);
  }

  /**
   * Get history entries with optional filtering
   * 获取历史记录（支持筛选）
   * 
   * Requirement 6.2: Display all history commands in reverse chronological order
   * Requirement 6.5: Support filtering by device, time range, and keyword
   */
  async getHistory(filter?: HistoryFilter, limit?: number): Promise<HistoryEntry[]> {
    let entries = this.loadAllEntries();

    // Apply filters if provided
    if (filter) {
      entries = entries.filter(entry => {
        // Filter by device ID
        if (filter.deviceId && entry.deviceId !== filter.deviceId) {
          return false;
        }

        // Filter by start date
        if (filter.startDate && entry.timestamp < filter.startDate) {
          return false;
        }

        // Filter by end date
        if (filter.endDate && entry.timestamp > filter.endDate) {
          return false;
        }

        // Filter by dangerous flag
        if (filter.isDangerous !== undefined && entry.isDangerous !== filter.isDangerous) {
          return false;
        }

        return true;
      });
    }

    // Sort by timestamp descending (newest first)
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit if provided
    if (limit !== undefined && limit > 0) {
      entries = entries.slice(0, limit);
    }

    return entries;
  }

  /**
   * Delete a specific history entry
   * 删除历史记录
   * 
   * Requirement 6.3: Allow viewing command details
   * (Deletion is part of history management)
   */
  async deleteEntry(entryId: string): Promise<void> {
    const entries = this.loadAllEntries();
    const filtered = entries.filter(entry => entry.id !== entryId);
    this.saveAllEntries(filtered);
  }

  /**
   * Clear all history entries
   * 清空历史记录
   */
  async clearHistory(): Promise<void> {
    storage.delete(StorageKeys.COMMAND_HISTORY);
  }

  /**
   * Search history by keyword
   * 搜索历史记录
   * 
   * Requirement 6.5: Support filtering by keyword
   */
  async searchHistory(query: string): Promise<HistoryEntry[]> {
    const entries = this.loadAllEntries();
    const lowerQuery = query.toLowerCase();

    // Search in user input, parsed command, device name, and output
    const matches = entries.filter(entry => {
      return (
        entry.userInput.toLowerCase().includes(lowerQuery) ||
        entry.parsedCommand.toLowerCase().includes(lowerQuery) ||
        entry.deviceName.toLowerCase().includes(lowerQuery) ||
        entry.output.toLowerCase().includes(lowerQuery)
      );
    });

    // Sort by timestamp descending (newest first)
    matches.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return matches;
  }
}

// Export singleton instance
export const commandHistoryStore = new CommandHistoryStoreImpl();

// Export class for testing
export { CommandHistoryStoreImpl };
