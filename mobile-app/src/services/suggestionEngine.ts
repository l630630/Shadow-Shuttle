/**
 * Suggestion Engine
 * 命令建议引擎
 * 
 * Provides intelligent command suggestions based on user input, context, and history.
 * Implements caching and scoring algorithms for fast and relevant suggestions.
 * 
 * 基于用户输入、上下文和历史提供智能命令建议。
 * 实现缓存和评分算法，提供快速且相关的建议。
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import {
  Suggestion,
  CommandContext,
  SuggestionSource,
} from '../types/nlc';
import { commandHistoryStore } from '../stores/commandHistoryStore';
import { commandFavoriteStore } from '../stores/commandFavoriteStore';

/**
 * Suggestion Engine Interface
 * 命令建议引擎接口
 */
export interface ISuggestionEngine {
  /**
   * Get command suggestions based on input and context
   * 基于输入和上下文获取命令建议
   * 
   * @param input User input text
   * @param context Command context
   * @returns Array of suggestions (max 5)
   */
  getSuggestions(
    input: string,
    context: CommandContext
  ): Promise<Suggestion[]>;

  /**
   * Record command usage for learning
   * 记录命令使用以供学习
   * 
   * @param command Executed command
   * @param context Command context
   */
  recordCommandUsage(command: string, context: CommandContext): void;

  /**
   * Clear suggestion cache
   * 清除建议缓存
   */
  clearCache(): void;
}

/**
 * Command Usage Record
 * 命令使用记录
 */
interface CommandUsage {
  command: string;
  count: number;
  lastUsed: Date;
  contexts: string[]; // Directories where command was used
}

/**
 * Cache Entry
 * 缓存条目
 */
interface CacheEntry {
  suggestions: Suggestion[];
  timestamp: number;
}

/**
 * Suggestion Engine Implementation
 * 命令建议引擎实现
 */
export class SuggestionEngine implements ISuggestionEngine {
  private usageMap: Map<string, CommandUsage> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxSuggestions = 5; // Requirement 5.6
  private readonly cacheTimeout = 60000; // 1 minute cache
  private readonly responseTimeout = 500; // 500ms max response time (Requirement 5.5)

  constructor() {
    this.loadUsageData();
  }

  /**
   * Load usage data from storage
   * 从存储加载使用数据
   */
  private async loadUsageData(): Promise<void> {
    try {
      // Load from command history
      const history = await commandHistoryStore.getHistory();
      
      for (const entry of history) {
        const usage = this.usageMap.get(entry.parsedCommand) || {
          command: entry.parsedCommand,
          count: 0,
          lastUsed: new Date(0),
          contexts: [],
        };

        usage.count++;
        if (new Date(entry.timestamp) > usage.lastUsed) {
          usage.lastUsed = new Date(entry.timestamp);
        }

        // Track directory context
        const dir = this.extractDirectory(entry.parsedCommand);
        if (dir && !usage.contexts.includes(dir)) {
          usage.contexts.push(dir);
        }

        this.usageMap.set(entry.parsedCommand, usage);
      }

      console.log(`Loaded ${this.usageMap.size} command usage records`);
    } catch (error) {
      console.error('Failed to load usage data:', error);
    }
  }

  /**
   * Extract directory from command
   * 从命令中提取目录
   */
  private extractDirectory(command: string): string | null {
    // Try to extract directory from cd commands
    const cdMatch = command.match(/cd\s+(.+)/);
    if (cdMatch) {
      return cdMatch[1].trim();
    }

    // Try to extract from paths in command
    const pathMatch = command.match(/([\/~][^\s]+)/);
    if (pathMatch) {
      const path = pathMatch[1];
      // Return directory part
      const lastSlash = path.lastIndexOf('/');
      return lastSlash > 0 ? path.substring(0, lastSlash) : path;
    }

    return null;
  }

  /**
   * Generate cache key
   * 生成缓存键
   */
  private getCacheKey(input: string, context: CommandContext): string {
    return `${input}:${context.currentDirectory}:${context.deviceInfo.os}`;
  }

  /**
   * Check if cache is valid
   * 检查缓存是否有效
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.cacheTimeout;
  }

  /**
   * Get command suggestions
   * 获取命令建议
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
   * 
   * @param input User input text
   * @param context Command context
   * @returns Array of suggestions (max 5)
   */
  async getSuggestions(
    input: string,
    context: CommandContext
  ): Promise<Suggestion[]> {
    const startTime = Date.now();

    try {
      // Requirement 5.7: Return empty array for empty input
      if (!input || input.trim().length === 0) {
        return [];
      }

      // Check cache first
      const cacheKey = this.getCacheKey(input, context);
      const cached = this.cache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached)) {
        console.log('Returning cached suggestions');
        return cached.suggestions;
      }

      // Collect suggestions from different sources
      const allSuggestions: Suggestion[] = [];

      // 1. Get suggestions from favorites (Requirement 5.1)
      const favoriteSuggestions = await this.getSuggestionsFromFavorites(input);
      allSuggestions.push(...favoriteSuggestions);

      // 2. Get suggestions from history (Requirement 5.1)
      const historySuggestions = await this.getSuggestionsFromHistory(input, context);
      allSuggestions.push(...historySuggestions);

      // 3. Get context-based suggestions (Requirement 5.3)
      const contextSuggestions = this.getContextBasedSuggestions(input, context);
      allSuggestions.push(...contextSuggestions);

      // Remove duplicates
      const uniqueSuggestions = this.deduplicateSuggestions(allSuggestions);

      // Score and sort suggestions (Requirement 5.4)
      const scoredSuggestions = this.scoreSuggestions(uniqueSuggestions, input, context);

      // Limit to max suggestions (Requirement 5.6)
      const limitedSuggestions = scoredSuggestions.slice(0, this.maxSuggestions);

      // Cache the results
      this.cache.set(cacheKey, {
        suggestions: limitedSuggestions,
        timestamp: Date.now(),
      });

      // Check response time (Requirement 5.5)
      const elapsed = Date.now() - startTime;
      if (elapsed > this.responseTimeout) {
        console.warn(`Suggestion generation took ${elapsed}ms (exceeds ${this.responseTimeout}ms target)`);
      }

      return limitedSuggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Get suggestions from favorites
   * 从收藏获取建议
   */
  private async getSuggestionsFromFavorites(input: string): Promise<Suggestion[]> {
    try {
      const favorites = await commandFavoriteStore.getFavorites();
      const suggestions: Suggestion[] = [];

      for (const favorite of favorites) {
        // Check if favorite matches input
        if (this.matchesInput(favorite.command, input) ||
            this.matchesInput(favorite.name, input) ||
            this.matchesInput(favorite.description, input)) {
          
          suggestions.push({
            command: favorite.command,
            description: favorite.description || favorite.name,
            score: 0, // Will be scored later
            source: 'favorite',
            usageCount: favorite.usageCount,
            lastUsed: favorite.updatedAt,
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error getting favorite suggestions:', error);
      return [];
    }
  }

  /**
   * Get suggestions from history
   * 从历史获取建议
   */
  private async getSuggestionsFromHistory(
    input: string,
    context: CommandContext
  ): Promise<Suggestion[]> {
    try {
      const history = await commandHistoryStore.getHistory();
      const suggestions: Suggestion[] = [];
      const seenCommands = new Set<string>();

      for (const entry of history) {
        // Skip duplicates
        if (seenCommands.has(entry.parsedCommand)) {
          continue;
        }

        // Check if command matches input
        if (this.matchesInput(entry.parsedCommand, input) ||
            this.matchesInput(entry.userInput, input)) {
          
          const usage = this.usageMap.get(entry.parsedCommand);
          
          suggestions.push({
            command: entry.parsedCommand,
            description: entry.userInput || 'From history',
            score: 0, // Will be scored later
            source: 'history',
            usageCount: usage?.count || 1,
            lastUsed: new Date(entry.timestamp),
          });

          seenCommands.add(entry.parsedCommand);
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error getting history suggestions:', error);
      return [];
    }
  }

  /**
   * Get context-based suggestions
   * 获取基于上下文的建议
   * 
   * Requirement 5.3: Context-relevant suggestions based on current directory
   */
  private getContextBasedSuggestions(
    input: string,
    context: CommandContext
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const currentDir = context.currentDirectory;

    // Get commands frequently used in this directory
    for (const [command, usage] of this.usageMap.entries()) {
      if (usage.contexts.includes(currentDir) && this.matchesInput(command, input)) {
        suggestions.push({
          command,
          description: `Frequently used in ${currentDir}`,
          score: 0, // Will be scored later
          source: 'context',
          usageCount: usage.count,
          lastUsed: usage.lastUsed,
        });
      }
    }

    return suggestions;
  }

  /**
   * Check if text matches input
   * 检查文本是否匹配输入
   */
  private matchesInput(text: string, input: string): boolean {
    if (!text || !input) return false;

    const lowerText = text.toLowerCase();
    const lowerInput = input.toLowerCase();

    // Exact match
    if (lowerText === lowerInput) return true;

    // Starts with
    if (lowerText.startsWith(lowerInput)) return true;

    // Contains
    if (lowerText.includes(lowerInput)) return true;

    // Fuzzy match (all characters in order)
    let textIndex = 0;
    for (const char of lowerInput) {
      textIndex = lowerText.indexOf(char, textIndex);
      if (textIndex === -1) return false;
      textIndex++;
    }

    return true;
  }

  /**
   * Remove duplicate suggestions
   * 移除重复的建议
   */
  private deduplicateSuggestions(suggestions: Suggestion[]): Suggestion[] {
    const seen = new Map<string, Suggestion>();

    for (const suggestion of suggestions) {
      const existing = seen.get(suggestion.command);

      if (!existing) {
        seen.set(suggestion.command, suggestion);
      } else {
        // Keep the one with higher usage count or more recent
        if (suggestion.usageCount > existing.usageCount ||
            (suggestion.lastUsed && existing.lastUsed && 
             suggestion.lastUsed > existing.lastUsed)) {
          seen.set(suggestion.command, suggestion);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Score and sort suggestions
   * 对建议进行评分和排序
   * 
   * Requirement 5.4: Recent commands should be prioritized
   */
  private scoreSuggestions(
    suggestions: Suggestion[],
    input: string,
    context: CommandContext
  ): Suggestion[] {
    const now = Date.now();

    for (const suggestion of suggestions) {
      let score = 0;

      // 1. Source priority
      if (suggestion.source === 'favorite') {
        score += 100;
      } else if (suggestion.source === 'context') {
        score += 50;
      } else if (suggestion.source === 'history') {
        score += 25;
      }

      // 2. Match quality
      const lowerCommand = suggestion.command.toLowerCase();
      const lowerInput = input.toLowerCase();

      if (lowerCommand === lowerInput) {
        score += 50; // Exact match
      } else if (lowerCommand.startsWith(lowerInput)) {
        score += 30; // Starts with
      } else if (lowerCommand.includes(lowerInput)) {
        score += 10; // Contains
      }

      // 3. Usage frequency
      score += Math.min(suggestion.usageCount * 2, 50);

      // 4. Recency (Requirement 5.4)
      if (suggestion.lastUsed) {
        const ageInDays = (now - suggestion.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        
        if (ageInDays < 1) {
          score += 40; // Used today
        } else if (ageInDays < 7) {
          score += 20; // Used this week
        } else if (ageInDays < 30) {
          score += 10; // Used this month
        }
      }

      suggestion.score = score;
    }

    // Sort by score (descending)
    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Record command usage
   * 记录命令使用
   * 
   * Requirement 5.2: Learn from user's command usage
   * 
   * @param command Executed command
   * @param context Command context
   */
  recordCommandUsage(command: string, context: CommandContext): void {
    try {
      const usage = this.usageMap.get(command) || {
        command,
        count: 0,
        lastUsed: new Date(0),
        contexts: [],
      };

      usage.count++;
      usage.lastUsed = new Date();

      // Track directory context
      if (!usage.contexts.includes(context.currentDirectory)) {
        usage.contexts.push(context.currentDirectory);
      }

      this.usageMap.set(command, usage);

      // Clear cache to reflect new usage
      this.clearCache();

      console.log(`Recorded usage for command: ${command} (count: ${usage.count})`);
    } catch (error) {
      console.error('Error recording command usage:', error);
    }
  }

  /**
   * Clear suggestion cache
   * 清除建议缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Suggestion cache cleared');
  }

  /**
   * Get usage statistics
   * 获取使用统计
   * 
   * @returns Usage statistics
   */
  getUsageStats(): {
    totalCommands: number;
    totalUsages: number;
    mostUsedCommands: Array<{ command: string; count: number }>;
  } {
    const totalCommands = this.usageMap.size;
    let totalUsages = 0;

    const commandCounts: Array<{ command: string; count: number }> = [];

    for (const [command, usage] of this.usageMap.entries()) {
      totalUsages += usage.count;
      commandCounts.push({ command, count: usage.count });
    }

    // Sort by count and get top 10
    const mostUsedCommands = commandCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalCommands,
      totalUsages,
      mostUsedCommands,
    };
  }
}

/**
 * Singleton instance
 * 单例实例
 */
let suggestionEngineInstance: SuggestionEngine | null = null;

/**
 * Get SuggestionEngine singleton instance
 * 获取命令建议引擎单例实例
 * 
 * @returns SuggestionEngine instance
 */
export function getSuggestionEngine(): SuggestionEngine {
  if (!suggestionEngineInstance) {
    suggestionEngineInstance = new SuggestionEngine();
  }
  return suggestionEngineInstance;
}

/**
 * Reset SuggestionEngine singleton (for testing)
 * 重置命令建议引擎单例（用于测试）
 */
export function resetSuggestionEngine(): void {
  suggestionEngineInstance = null;
}

export default SuggestionEngine;
