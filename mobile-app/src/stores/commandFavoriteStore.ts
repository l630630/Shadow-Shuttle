/**
 * Command Favorite Store
 * 命令收藏存储
 * 
 * Manages favorite commands with MMKV for high-performance storage.
 * Implements uniqueness checking to prevent duplicate favorites.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7
 */

import { MMKV } from 'react-native-mmkv';
import { FavoriteEntry } from '../types/nlc';
import { StorageKeys } from '../config/nlc-constants';

// Initialize MMKV storage instance
const storage = new MMKV();

/**
 * Command Favorite Store Interface
 * 命令收藏存储接口
 */
export interface CommandFavoriteStore {
  /**
   * Add a new favorite command
   * 添加收藏命令
   * @param favorite Favorite entry to add
   * @throws Error if a favorite with the same command already exists
   */
  addFavorite(favorite: FavoriteEntry): Promise<void>;

  /**
   * Get all favorite commands
   * 获取所有收藏命令
   * @returns Array of favorite entries sorted by updatedAt (newest first)
   */
  getFavorites(): Promise<FavoriteEntry[]>;

  /**
   * Update an existing favorite command
   * 更新收藏命令
   * @param favoriteId ID of the favorite to update
   * @param updates Partial updates to apply
   * @throws Error if favorite not found
   */
  updateFavorite(
    favoriteId: string,
    updates: Partial<FavoriteEntry>
  ): Promise<void>;

  /**
   * Delete a favorite command
   * 删除收藏命令
   * @param favoriteId ID of the favorite to delete
   */
  deleteFavorite(favoriteId: string): Promise<void>;

  /**
   * Search favorites by keyword
   * 搜索收藏命令
   * @param query Search keyword
   * @returns Matching favorite entries
   */
  searchFavorites(query: string): Promise<FavoriteEntry[]>;

  /**
   * Clear all favorites
   * 清空所有收藏
   */
  clearFavorites(): Promise<void>;
}

/**
 * Command Favorite Store Implementation
 * 命令收藏存储实现
 */
class CommandFavoriteStoreImpl implements CommandFavoriteStore {
  /**
   * Load all favorite entries from storage
   * 从存储加载所有收藏
   */
  private loadAllFavorites(): FavoriteEntry[] {
    try {
      const data = storage.getString(StorageKeys.COMMAND_FAVORITES);
      if (!data) {
        return [];
      }

      const favorites = JSON.parse(data);
      
      // Convert timestamp strings back to Date objects
      return favorites.map((favorite: any) => ({
        ...favorite,
        createdAt: new Date(favorite.createdAt),
        updatedAt: new Date(favorite.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to load favorite entries:', error);
      return [];
    }
  }

  /**
   * Save all favorite entries to storage
   * 保存所有收藏到存储
   */
  private saveAllFavorites(favorites: FavoriteEntry[]): void {
    try {
      storage.set(StorageKeys.COMMAND_FAVORITES, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorite entries:', error);
      throw new Error('Failed to save favorite entries');
    }
  }

  /**
   * Check if a command already exists in favorites
   * 检查命令是否已存在于收藏中
   * @param command Command string to check
   * @param excludeId Optional ID to exclude from check (for updates)
   * @returns The existing favorite entry if found, undefined otherwise
   */
  private findExistingFavorite(
    command: string,
    excludeId?: string
  ): FavoriteEntry | undefined {
    const favorites = this.loadAllFavorites();
    return favorites.find(
      fav => fav.command === command && fav.id !== excludeId
    );
  }

  /**
   * Add a new favorite command
   * 添加收藏命令
   * 
   * Requirement 7.1: Allow favoriting commands from history or chat interface
   * Requirement 7.2: Prompt user to input command name and description
   * 
   * Implements uniqueness checking to prevent duplicate favorites.
   * If a favorite with the same command already exists, throws an error.
   */
  async addFavorite(favorite: FavoriteEntry): Promise<void> {
    // Check for duplicate command
    const existing = this.findExistingFavorite(favorite.command);
    if (existing) {
      throw new Error(
        `A favorite with this command already exists: "${existing.name}"`
      );
    }

    const favorites = this.loadAllFavorites();
    
    // Add new favorite
    favorites.push(favorite);
    
    // Save to storage
    this.saveAllFavorites(favorites);
  }

  /**
   * Get all favorite commands
   * 获取所有收藏命令
   * 
   * Requirement 7.3: Display all favorite commands
   * 
   * Returns favorites sorted by updatedAt (newest first)
   */
  async getFavorites(): Promise<FavoriteEntry[]> {
    const favorites = this.loadAllFavorites();

    // Sort by updatedAt descending (newest first)
    favorites.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return favorites;
  }

  /**
   * Update an existing favorite command
   * 更新收藏命令
   * 
   * Requirement 7.5: Support editing command name, description, and command content
   * 
   * Updates the specified favorite with the provided changes.
   * Automatically updates the updatedAt timestamp.
   * Checks for command uniqueness if command is being updated.
   */
  async updateFavorite(
    favoriteId: string,
    updates: Partial<FavoriteEntry>
  ): Promise<void> {
    const favorites = this.loadAllFavorites();
    const index = favorites.findIndex(fav => fav.id === favoriteId);

    if (index === -1) {
      throw new Error(`Favorite not found: ${favoriteId}`);
    }

    // If updating command, check for duplicates
    if (updates.command && updates.command !== favorites[index].command) {
      const existing = this.findExistingFavorite(updates.command, favoriteId);
      if (existing) {
        throw new Error(
          `A favorite with this command already exists: "${existing.name}"`
        );
      }
    }

    // Apply updates
    favorites[index] = {
      ...favorites[index],
      ...updates,
      // Always update the updatedAt timestamp
      updatedAt: new Date(),
      // Preserve the original ID and createdAt
      id: favorites[index].id,
      createdAt: favorites[index].createdAt,
    };

    // Save to storage
    this.saveAllFavorites(favorites);
  }

  /**
   * Delete a favorite command
   * 删除收藏命令
   * 
   * Requirement 7.6: Support deleting favorite commands
   */
  async deleteFavorite(favoriteId: string): Promise<void> {
    const favorites = this.loadAllFavorites();
    const filtered = favorites.filter(fav => fav.id !== favoriteId);
    this.saveAllFavorites(filtered);
  }

  /**
   * Search favorites by keyword
   * 搜索收藏命令
   * 
   * Requirement 7.7: Support searching favorites by name
   * 
   * Searches in name, description, command content, and tags.
   * Returns results sorted by updatedAt (newest first).
   */
  async searchFavorites(query: string): Promise<FavoriteEntry[]> {
    const favorites = this.loadAllFavorites();
    const lowerQuery = query.toLowerCase();

    // Search in name, description, command, and tags
    const matches = favorites.filter(favorite => {
      return (
        favorite.name.toLowerCase().includes(lowerQuery) ||
        favorite.description.toLowerCase().includes(lowerQuery) ||
        favorite.command.toLowerCase().includes(lowerQuery) ||
        favorite.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });

    // Sort by updatedAt descending (newest first)
    matches.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return matches;
  }

  /**
   * Clear all favorites
   * 清空所有收藏
   */
  async clearFavorites(): Promise<void> {
    storage.delete(StorageKeys.COMMAND_FAVORITES);
  }
}

// Export singleton instance
export const commandFavoriteStore = new CommandFavoriteStoreImpl();

// Export class for testing
export { CommandFavoriteStoreImpl };
