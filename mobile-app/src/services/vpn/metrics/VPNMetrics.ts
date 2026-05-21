/**
 * VPN Metrics
 * 
 * Performance monitoring and metrics collection for VPN operations
 */

/**
 * Connection attempt result
 */
export interface ConnectionAttempt {
  timestamp: Date;
  success: boolean;
  duration: number;
  error?: string;
}

/**
 * Reconnection event
 */
export interface ReconnectionEvent {
  timestamp: Date;
  reason: 'network_change' | 'app_resume' | 'manual' | 'error';
  success: boolean;
  attempts: number;
  totalDuration: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  // Connection metrics
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  
  // Timing metrics
  averageConnectionTime: number;
  minConnectionTime: number;
  maxConnectionTime: number;
  
  // Reconnection metrics
  totalReconnections: number;
  successfulReconnections: number;
  failedReconnections: number;
  reconnectionSuccessRate: number;
  
  // Session metrics
  totalSessions: number;
  currentSessionDuration: number;
  averageSessionDuration: number;
  longestSessionDuration: number;
}

/**
 * VPN Metrics Collector
 */
export class VPNMetrics {
  private connectionAttempts: ConnectionAttempt[] = [];
  private reconnectionEvents: ReconnectionEvent[] = [];
  private sessionStartTime: Date | null = null;
  private sessionDurations: number[] = [];
  private maxHistorySize: number = 100;

  /**
   * Record connection attempt
   */
  public recordConnectionAttempt(success: boolean, duration: number, error?: string): void {
    const attempt: ConnectionAttempt = {
      timestamp: new Date(),
      success,
      duration,
      error,
    };

    this.connectionAttempts.push(attempt);
    this.trimHistory(this.connectionAttempts);

    // Start session if successful
    if (success) {
      this.startSession();
    }
  }

  /**
   * Record reconnection event
   */
  public recordReconnection(
    reason: ReconnectionEvent['reason'],
    success: boolean,
    attempts: number,
    totalDuration: number
  ): void {
    const event: ReconnectionEvent = {
      timestamp: new Date(),
      reason,
      success,
      attempts,
      totalDuration,
    };

    this.reconnectionEvents.push(event);
    this.trimHistory(this.reconnectionEvents);
  }

  /**
   * Start session
   */
  public startSession(): void {
    this.sessionStartTime = new Date();
  }

  /**
   * End session
   */
  public endSession(): void {
    if (this.sessionStartTime) {
      const duration = Date.now() - this.sessionStartTime.getTime();
      this.sessionDurations.push(duration);
      this.trimHistory(this.sessionDurations);
      this.sessionStartTime = null;
    }
  }

  /**
   * Get current session duration
   */
  public getCurrentSessionDuration(): number {
    if (!this.sessionStartTime) {
      return 0;
    }
    return Date.now() - this.sessionStartTime.getTime();
  }

  /**
   * Calculate performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    const totalAttempts = this.connectionAttempts.length;
    const successfulAttempts = this.connectionAttempts.filter(a => a.success).length;
    const failedAttempts = totalAttempts - successfulAttempts;
    const successRate = totalAttempts > 0 ? successfulAttempts / totalAttempts : 0;

    const successfulDurations = this.connectionAttempts
      .filter(a => a.success)
      .map(a => a.duration);
    
    const averageConnectionTime = successfulDurations.length > 0
      ? successfulDurations.reduce((sum, d) => sum + d, 0) / successfulDurations.length
      : 0;
    
    const minConnectionTime = successfulDurations.length > 0
      ? Math.min(...successfulDurations)
      : 0;
    
    const maxConnectionTime = successfulDurations.length > 0
      ? Math.max(...successfulDurations)
      : 0;

    const totalReconnections = this.reconnectionEvents.length;
    const successfulReconnections = this.reconnectionEvents.filter(e => e.success).length;
    const failedReconnections = totalReconnections - successfulReconnections;
    const reconnectionSuccessRate = totalReconnections > 0
      ? successfulReconnections / totalReconnections
      : 0;

    const totalSessions = this.sessionDurations.length;
    const currentSessionDuration = this.getCurrentSessionDuration();
    const averageSessionDuration = totalSessions > 0
      ? this.sessionDurations.reduce((sum, d) => sum + d, 0) / totalSessions
      : 0;
    const longestSessionDuration = totalSessions > 0
      ? Math.max(...this.sessionDurations)
      : 0;

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate,
      averageConnectionTime,
      minConnectionTime,
      maxConnectionTime,
      totalReconnections,
      successfulReconnections,
      failedReconnections,
      reconnectionSuccessRate,
      totalSessions,
      currentSessionDuration,
      averageSessionDuration,
      longestSessionDuration,
    };
  }

  /**
   * Get connection attempts
   */
  public getConnectionAttempts(limit?: number): ConnectionAttempt[] {
    if (limit) {
      return this.connectionAttempts.slice(-limit);
    }
    return [...this.connectionAttempts];
  }

  /**
   * Get reconnection events
   */
  public getReconnectionEvents(limit?: number): ReconnectionEvent[] {
    if (limit) {
      return this.reconnectionEvents.slice(-limit);
    }
    return [...this.reconnectionEvents];
  }

  /**
   * Get recent failures
   */
  public getRecentFailures(count: number = 10): ConnectionAttempt[] {
    return this.connectionAttempts
      .filter(a => !a.success)
      .slice(-count);
  }

  /**
   * Get failure rate in time window
   */
  public getFailureRate(windowMs: number = 3600000): number {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const attemptsInWindow = this.connectionAttempts.filter(
      a => a.timestamp.getTime() >= windowStart
    );
    
    if (attemptsInWindow.length === 0) {
      return 0;
    }
    
    const failures = attemptsInWindow.filter(a => !a.success).length;
    return failures / attemptsInWindow.length;
  }

  /**
   * Check if connection is stable
   */
  public isConnectionStable(
    windowMs: number = 3600000,
    maxFailureRate: number = 0.2
  ): boolean {
    return this.getFailureRate(windowMs) <= maxFailureRate;
  }

  /**
   * Export metrics as JSON
   */
  public exportMetrics(): string {
    return JSON.stringify({
      metrics: this.getMetrics(),
      connectionAttempts: this.connectionAttempts,
      reconnectionEvents: this.reconnectionEvents,
      sessionDurations: this.sessionDurations,
    }, null, 2);
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.connectionAttempts = [];
    this.reconnectionEvents = [];
    this.sessionDurations = [];
    this.sessionStartTime = null;
  }

  /**
   * Trim history to max size
   */
  private trimHistory<T>(array: T[]): void {
    if (array.length > this.maxHistorySize) {
      array.splice(0, array.length - this.maxHistorySize);
    }
  }

  /**
   * Set max history size
   */
  public setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    this.trimHistory(this.connectionAttempts);
    this.trimHistory(this.reconnectionEvents);
    this.trimHistory(this.sessionDurations);
  }

  /**
   * Get max history size
   */
  public getMaxHistorySize(): number {
    return this.maxHistorySize;
  }
}

/**
 * Global metrics instance
 */
let globalMetrics: VPNMetrics | null = null;

/**
 * Get global metrics instance
 */
export function getVPNMetrics(): VPNMetrics {
  if (!globalMetrics) {
    globalMetrics = new VPNMetrics();
  }
  return globalMetrics;
}

/**
 * Set global metrics instance
 */
export function setVPNMetrics(metrics: VPNMetrics): void {
  globalMetrics = metrics;
}
