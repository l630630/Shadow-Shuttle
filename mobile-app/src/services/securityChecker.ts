/**
 * Security Checker Service
 * 安全检查器服务
 * 
 * Detects dangerous commands and requires user confirmation before execution.
 * 检测危险命令并在执行前要求用户确认。
 * 
 * Validates Requirements: 4.1, 4.2, 4.6, 4.7
 */

import {
  SecurityCheckResult,
  DangerousPattern,
  RiskLevel,
} from '../types/nlc';

/**
 * SecurityChecker Interface
 * 安全检查器接口
 */
export interface ISecurityChecker {
  /**
   * Check if a command is dangerous
   * 检查命令是否危险
   * 
   * @param command - Command string to check
   * @returns Security check result
   */
  checkCommand(command: string): SecurityCheckResult;

  /**
   * Get list of dangerous patterns
   * 获取危险模式列表
   * 
   * @returns Array of dangerous patterns
   */
  getDangerousPatterns(): DangerousPattern[];

  /**
   * Add a custom dangerous pattern
   * 添加自定义危险模式
   * 
   * @param pattern - Dangerous pattern to add
   */
  addDangerousPattern(pattern: DangerousPattern): void;

  /**
   * Remove a dangerous pattern
   * 移除危险模式
   * 
   * @param patternId - Pattern ID to remove
   */
  removeDangerousPattern(patternId: string): void;
}

/**
 * SecurityChecker Implementation
 * 安全检查器实现
 */
export class SecurityChecker implements ISecurityChecker {
  private dangerousPatterns: Map<string, DangerousPattern>;

  constructor() {
    this.dangerousPatterns = new Map();
    this.initializeDefaultPatterns();
  }

  /**
   * Initialize default dangerous command patterns
   * 初始化默认危险命令模式
   * 
   * Validates Requirements: 4.1, 4.2, 4.7
   */
  private initializeDefaultPatterns(): void {
    const defaultPatterns: DangerousPattern[] = [
      {
        id: 'rm-rf',
        pattern: /rm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|--recursive\s+--force|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\s+/,
        description: 'Recursive force delete - can permanently delete files and directories',
        riskLevel: 'critical',
        examples: ['rm -rf /', 'rm -rf *', 'rm -fr /home'],
      },
      {
        id: 'dd',
        pattern: /\bdd\s+(if=|of=)/,
        description: 'Disk duplication - can overwrite entire disks',
        riskLevel: 'critical',
        examples: ['dd if=/dev/zero of=/dev/sda', 'dd if=/dev/sda of=/dev/sdb'],
      },
      {
        id: 'mkfs',
        pattern: /\bmkfs(\.[a-z0-9]+)?\s+/,
        description: 'Format filesystem - will erase all data on the partition',
        riskLevel: 'critical',
        examples: ['mkfs.ext4 /dev/sda1', 'mkfs /dev/sdb1'],
      },
      {
        id: 'fdisk',
        pattern: /\bfdisk\s+/,
        description: 'Disk partitioning - can destroy partition table',
        riskLevel: 'high',
        examples: ['fdisk /dev/sda', 'fdisk -l /dev/sdb'],
      },
      {
        id: 'format',
        pattern: /\bformat\s+/,
        description: 'Format disk - will erase all data',
        riskLevel: 'critical',
        examples: ['format C:', 'format D: /fs:NTFS'],
      },
      {
        id: 'sudo',
        pattern: /\bsudo\s+/,
        description: 'Elevated privileges - command will run with administrator rights',
        riskLevel: 'medium',
        examples: ['sudo rm -rf /', 'sudo apt-get install'],
      },
      {
        id: 'chmod-777',
        pattern: /\bchmod\s+(-R\s+)?777\s+/,
        description: 'Set full permissions - security risk',
        riskLevel: 'medium',
        examples: ['chmod 777 /var/www', 'chmod -R 777 /'],
      },
      {
        id: 'chown-root',
        pattern: /\bchown\s+(-R\s+)?root\s+/,
        description: 'Change ownership to root - can affect system files',
        riskLevel: 'high',
        examples: ['chown root /etc/passwd', 'chown -R root /home'],
      },
      {
        id: 'kill-all',
        pattern: /\bkillall\s+/,
        description: 'Kill all processes by name - can terminate critical services',
        riskLevel: 'medium',
        examples: ['killall nginx', 'killall -9 systemd'],
      },
      {
        id: 'reboot-shutdown',
        pattern: /\b(reboot|shutdown|poweroff|halt)\s*/,
        description: 'System power control - will restart or shutdown the system',
        riskLevel: 'medium',
        examples: ['reboot', 'shutdown -h now', 'poweroff'],
      },
    ];

    defaultPatterns.forEach(pattern => {
      this.dangerousPatterns.set(pattern.id, pattern);
    });
  }

  /**
   * Check if a command is dangerous
   * 检查命令是否危险
   * 
   * Validates Requirements: 4.1, 4.2, 4.6, 4.7
   * 
   * @param command - Command string to check
   * @returns Security check result
   */
  checkCommand(command: string): SecurityCheckResult {
    const matchedPatterns: DangerousPattern[] = [];
    const warnings: string[] = [];

    // Check command against all dangerous patterns
    for (const pattern of this.dangerousPatterns.values()) {
      if (pattern.pattern.test(command)) {
        matchedPatterns.push(pattern);
        warnings.push(pattern.description);
      }
    }

    // Determine overall risk level
    const riskLevel = this.calculateRiskLevel(matchedPatterns);
    const isDangerous = matchedPatterns.length > 0;
    const requiresConfirmation = isDangerous && riskLevel !== 'low';

    return {
      isDangerous,
      riskLevel,
      matchedPatterns,
      warnings,
      requiresConfirmation,
    };
  }

  /**
   * Calculate overall risk level from matched patterns
   * 从匹配的模式计算总体风险级别
   * 
   * @param patterns - Matched dangerous patterns
   * @returns Overall risk level
   */
  private calculateRiskLevel(patterns: DangerousPattern[]): RiskLevel {
    if (patterns.length === 0) {
      return 'low';
    }

    // Find the highest risk level among matched patterns
    const riskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
    let maxRiskIndex = 0;

    for (const pattern of patterns) {
      const riskIndex = riskLevels.indexOf(pattern.riskLevel);
      if (riskIndex > maxRiskIndex) {
        maxRiskIndex = riskIndex;
      }
    }

    return riskLevels[maxRiskIndex];
  }

  /**
   * Get list of dangerous patterns
   * 获取危险模式列表
   * 
   * Validates Requirement: 4.6
   * 
   * @returns Array of dangerous patterns
   */
  getDangerousPatterns(): DangerousPattern[] {
    return Array.from(this.dangerousPatterns.values());
  }

  /**
   * Add a custom dangerous pattern
   * 添加自定义危险模式
   * 
   * Validates Requirement: 4.6
   * 
   * @param pattern - Dangerous pattern to add
   */
  addDangerousPattern(pattern: DangerousPattern): void {
    this.dangerousPatterns.set(pattern.id, pattern);
  }

  /**
   * Remove a dangerous pattern
   * 移除危险模式
   * 
   * Validates Requirement: 4.6
   * 
   * @param patternId - Pattern ID to remove
   */
  removeDangerousPattern(patternId: string): void {
    this.dangerousPatterns.delete(patternId);
  }
}

/**
 * Singleton instance
 * 单例实例
 */
let securityCheckerInstance: SecurityChecker | null = null;

/**
 * Get SecurityChecker singleton instance
 * 获取安全检查器单例实例
 * 
 * @returns SecurityChecker instance
 */
export function getSecurityChecker(): SecurityChecker {
  if (!securityCheckerInstance) {
    securityCheckerInstance = new SecurityChecker();
  }
  return securityCheckerInstance;
}

/**
 * Reset SecurityChecker singleton (for testing)
 * 重置安全检查器单例（用于测试）
 */
export function resetSecurityChecker(): void {
  securityCheckerInstance = null;
}

export default SecurityChecker;
