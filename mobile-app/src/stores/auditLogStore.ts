/**
 * Audit Log Store
 * 审计日志存储
 * 
 * Manages audit logs for all command executions with MMKV for high-performance storage.
 * Implements retention policy (30 days) with automatic cleanup.
 * Supports export to JSON and CSV formats.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
 */

import { MMKV } from 'react-native-mmkv';
import { AuditLogEntry, AuditLogFilter, RiskLevel } from '../types/nlc';
import { StorageKeys, DEFAULT_SETTINGS } from '../config/nlc-constants';

// Initialize MMKV storage instance
const storage = new MMKV();

// Default retention period in days
const DEFAULT_RETENTION_DAYS = DEFAULT_SETTINGS.auditLogRetentionDays;

/**
 * Audit Log Store Interface
 * 审计日志存储接口
 */
export interface AuditLogStore {
  /**
   * Add a new audit log entry
   * 添加审计日志
   * @param log Audit log entry to add
   */
  addLog(log: AuditLogEntry): Promise<void>;

  /**
   * Get audit logs with optional filtering
   * 获取审计日志（支持筛选）
   * @param filter Optional filter conditions
   * @param limit Maximum number of entries to return
   * @returns Array of audit log entries sorted by timestamp (newest first)
   */
  getLogs(filter?: AuditLogFilter, limit?: number): Promise<AuditLogEntry[]>;

  /**
   * Export logs to JSON or CSV format
   * 导出日志
   * @param format Export format ('json' or 'csv')
   * @param filter Optional filter conditions
   * @returns Exported file content as string
   */
  exportLogs(
    format: 'json' | 'csv',
    filter?: AuditLogFilter
  ): Promise<string>;

  /**
   * Clean up old logs beyond retention period
   * 清理过期日志
   * @param daysToKeep Number of days to keep logs (default: 30)
   * @returns Number of logs deleted
   */
  cleanupOldLogs(daysToKeep?: number): Promise<number>;
}

/**
 * Audit Log Store Implementation
 * 审计日志存储实现
 */
class AuditLogStoreImpl implements AuditLogStore {
  /**
   * Load all audit log entries from storage
   * 从存储加载所有审计日志
   */
  private loadAllLogs(): AuditLogEntry[] {
    try {
      const data = storage.getString(StorageKeys.AUDIT_LOGS);
      if (!data) {
        return [];
      }

      const logs = JSON.parse(data);
      
      // Convert timestamp strings back to Date objects
      return logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      return [];
    }
  }

  /**
   * Save all audit log entries to storage
   * 保存所有审计日志到存储
   */
  private saveAllLogs(logs: AuditLogEntry[]): void {
    try {
      storage.set(StorageKeys.AUDIT_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save audit logs:', error);
      throw new Error('Failed to save audit logs');
    }
  }

  /**
   * Add a new audit log entry
   * 添加审计日志
   * 
   * Requirement 11.1: Record timestamp, user input, AI parsed result, executed command, and execution result
   * Requirement 11.2: Mark dangerous commands as high-risk operations
   */
  async addLog(log: AuditLogEntry): Promise<void> {
    const logs = this.loadAllLogs();
    
    // Add new log entry
    logs.push(log);
    
    // Save to storage
    this.saveAllLogs(logs);
  }

  /**
   * Get audit logs with optional filtering
   * 获取审计日志（支持筛选）
   * 
   * Requirement 11.3: Display all log records
   * Requirement 11.4: Support filtering by time range, device, and risk level
   */
  async getLogs(filter?: AuditLogFilter, limit?: number): Promise<AuditLogEntry[]> {
    let logs = this.loadAllLogs();

    // Apply filters if provided
    if (filter) {
      logs = logs.filter(log => {
        // Filter by device ID
        if (filter.deviceId && log.deviceId !== filter.deviceId) {
          return false;
        }

        // Filter by start date
        if (filter.startDate && log.timestamp < filter.startDate) {
          return false;
        }

        // Filter by end date
        if (filter.endDate && log.timestamp > filter.endDate) {
          return false;
        }

        // Filter by risk level
        if (filter.riskLevel && log.riskLevel !== filter.riskLevel) {
          return false;
        }

        return true;
      });
    }

    // Sort by timestamp descending (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit if provided
    if (limit !== undefined && limit > 0) {
      logs = logs.slice(0, limit);
    }

    return logs;
  }

  /**
   * Export logs to JSON or CSV format
   * 导出日志
   * 
   * Requirement 11.5: Support export to JSON or CSV format
   */
  async exportLogs(
    format: 'json' | 'csv',
    filter?: AuditLogFilter
  ): Promise<string> {
    // Get filtered logs
    const logs = await this.getLogs(filter);

    if (format === 'json') {
      return this.exportToJSON(logs);
    } else {
      return this.exportToCSV(logs);
    }
  }

  /**
   * Export logs to JSON format
   * 导出为 JSON 格式
   */
  private exportToJSON(logs: AuditLogEntry[]): string {
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export logs to CSV format
   * 导出为 CSV 格式
   */
  private exportToCSV(logs: AuditLogEntry[]): string {
    if (logs.length === 0) {
      return '';
    }

    // CSV header
    const headers = [
      'ID',
      'Timestamp',
      'Device ID',
      'User Input',
      'AI Parsed Command',
      'Executed Command',
      'Output',
      'Exit Code',
      'Risk Level',
      'Was Confirmed',
      'Execution Time (ms)',
    ];

    // CSV rows
    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.deviceId,
      this.escapeCSVField(log.userInput),
      this.escapeCSVField(log.aiParsedCommand),
      this.escapeCSVField(log.executedCommand),
      this.escapeCSVField(log.output),
      log.exitCode.toString(),
      log.riskLevel,
      log.wasConfirmed.toString(),
      log.executionTime.toString(),
    ]);

    // Combine header and rows
    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ];

    return csvLines.join('\n');
  }

  /**
   * Escape CSV field to handle special characters
   * 转义 CSV 字段
   */
  private escapeCSVField(field: string): string {
    // If field contains comma, newline, or quote, wrap in quotes and escape quotes
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * Clean up old logs beyond retention period
   * 清理过期日志
   * 
   * Requirement 11.6: Store logs for maximum 30 days
   * Requirement 11.7: Automatically delete expired logs
   */
  async cleanupOldLogs(daysToKeep: number = DEFAULT_RETENTION_DAYS): Promise<number> {
    const logs = this.loadAllLogs();
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Filter logs to keep only those within retention period
    const logsToKeep = logs.filter(log => log.timestamp >= cutoffDate);
    
    // Calculate number of deleted logs
    const deletedCount = logs.length - logsToKeep.length;

    // Save filtered logs
    if (deletedCount > 0) {
      this.saveAllLogs(logsToKeep);
    }

    return deletedCount;
  }
}

// Export singleton instance
export const auditLogStore = new AuditLogStoreImpl();

// Export class for testing
export { AuditLogStoreImpl };
