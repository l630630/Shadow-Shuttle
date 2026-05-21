/**
 * VPN Logger
 * 
 * Centralized logging for VPN operations with sensitive data filtering
 */

/**
 * Log level
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  minLevel: LogLevel;
  maxEntries: number;
  enableConsole: boolean;
  enableStorage: boolean;
  filterSensitiveData: boolean;
}

/**
 * VPN Logger
 */
export class VPNLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private sensitivePatterns: RegExp[] = [
    /privatekey\s*=\s*[^\s]+/gi,
    /presharedkey\s*=\s*[^\s]+/gi,
    /password["\s:=]+[^\s"]+/gi,
    /token["\s:=]+[^\s"]+/gi,
    /key["\s:=]+[^\s"]+/gi,
    /secret["\s:=]+[^\s"]+/gi,
  ];

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: LogLevel.INFO,
      maxEntries: 1000,
      enableConsole: __DEV__,
      enableStorage: true,
      filterSensitiveData: true,
      ...config,
    };
  }

  /**
   * Log debug message
   */
  public debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Log info message
   */
  public info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  /**
   * Log warning message
   */
  public warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  /**
   * Log error message
   */
  public error(category: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  /**
   * Log message
   */
  private log(level: LogLevel, category: string, message: string, data?: any): void {
    // Check if level is enabled
    if (level < this.config.minLevel) {
      return;
    }

    // Filter sensitive data
    const filteredMessage = this.config.filterSensitiveData
      ? this.filterSensitiveData(message)
      : message;
    const filteredData = this.config.filterSensitiveData && data
      ? this.filterSensitiveData(JSON.stringify(data))
      : data;

    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message: filteredMessage,
      data: filteredData ? JSON.parse(filteredData) : undefined,
    };

    // Add to logs
    this.logs.push(entry);

    // Trim logs if needed
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Storage (async, don't wait)
    if (this.config.enableStorage) {
      this.logToStorage(entry).catch(err => {
        console.error('Failed to log to storage:', err);
      });
    }
  }

  /**
   * Filter sensitive data from string
   */
  private filterSensitiveData(text: string): string {
    let filtered = text;
    
    for (const pattern of this.sensitivePatterns) {
      filtered = filtered.replace(pattern, (match) => {
        const parts = match.split(/[=:\s]+/);
        if (parts.length >= 2) {
          return `${parts[0]}=***REDACTED***`;
        }
        return '***REDACTED***';
      });
    }
    
    return filtered;
  }

  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${this.formatTimestamp(entry.timestamp)}] [${LogLevel[entry.level]}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data);
        break;
    }
  }

  /**
   * Log to storage (async)
   */
  private async logToStorage(entry: LogEntry): Promise<void> {
    // TODO: Implement storage (e.g., AsyncStorage, MMKV)
    // For now, just skip
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(date: Date): string {
    return date.toISOString();
  }

  /**
   * Get all logs
   */
  public getLogs(filter?: {
    level?: LogLevel;
    category?: string;
    since?: Date;
  }): LogEntry[] {
    let filtered = this.logs;

    if (filter?.level !== undefined) {
      filtered = filtered.filter(log => log.level >= filter.level!);
    }

    if (filter?.category) {
      filtered = filtered.filter(log => log.category === filter.category);
    }

    if (filter?.since) {
      filtered = filtered.filter(log => log.timestamp >= filter.since!);
    }

    return filtered;
  }

  /**
   * Export logs as string
   */
  public exportLogs(filter?: {
    level?: LogLevel;
    category?: string;
    since?: Date;
  }): string {
    const logs = this.getLogs(filter);
    
    return logs.map(entry => {
      const timestamp = this.formatTimestamp(entry.timestamp);
      const level = LogLevel[entry.level];
      const data = entry.data ? `\n${JSON.stringify(entry.data, null, 2)}` : '';
      return `[${timestamp}] [${level}] [${entry.category}] ${entry.message}${data}`;
    }).join('\n\n');
  }

  /**
   * Clear logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get log count
   */
  public getLogCount(level?: LogLevel): number {
    if (level === undefined) {
      return this.logs.length;
    }
    return this.logs.filter(log => log.level === level).length;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

/**
 * Global logger instance
 */
let globalLogger: VPNLogger | null = null;

/**
 * Get global logger instance
 */
export function getVPNLogger(): VPNLogger {
  if (!globalLogger) {
    globalLogger = new VPNLogger();
  }
  return globalLogger;
}

/**
 * Set global logger instance
 */
export function setVPNLogger(logger: VPNLogger): void {
  globalLogger = logger;
}
