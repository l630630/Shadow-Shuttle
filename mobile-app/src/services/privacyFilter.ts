/**
 * Privacy Filter Service
 * 隐私过滤服务
 * 
 * Sanitizes sensitive information before sending to AI services
 * and restores original values after receiving responses.
 * 
 * Validates Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import {
  SanitizedText,
  SensitiveMapping,
  SensitiveInfo,
  SensitiveType,
} from '../types/nlc';

/**
 * PrivacyFilter Interface
 * Defines the contract for privacy filtering operations
 */
export interface IPrivacyFilter {
  /**
   * Sanitize text by replacing sensitive information with placeholders
   * @param text Original text containing potential sensitive information
   * @returns Sanitized text with mapping for restoration
   */
  sanitize(text: string): SanitizedText;

  /**
   * Restore sanitized text back to original using the mapping
   * @param text Sanitized text with placeholders
   * @param mapping Mapping from placeholders to original values
   * @returns Restored text with original sensitive information
   */
  restore(text: string, mapping: SensitiveMapping): string;

  /**
   * Detect sensitive information in text
   * @param text Text to analyze
   * @returns Array of detected sensitive information with positions
   */
  detectSensitiveInfo(text: string): SensitiveInfo[];
}

/**
 * Regular expression patterns for detecting sensitive information
 */
const SENSITIVE_PATTERNS = {
  // File paths (Unix and Windows)
  // Matches: /home/user/file.txt, C:\Users\user\file.txt, ~/documents/file.pdf
  file_path: [
    // Unix absolute paths
    /(?:^|\s)(\/(?:[a-zA-Z0-9_\-\.]+\/)*[a-zA-Z0-9_\-\.]+)(?:\s|$)/g,
    // Unix home directory paths
    /(?:^|\s)(~\/(?:[a-zA-Z0-9_\-\.]+\/)*[a-zA-Z0-9_\-\.]+)(?:\s|$)/g,
    // Windows paths
    /(?:^|\s)([A-Za-z]:\\(?:[a-zA-Z0-9_\-\.]+\\)*[a-zA-Z0-9_\-\.]+)(?:\s|$)/g,
  ],

  // IP addresses (IPv4 and IPv6)
  // Matches: 192.168.1.1, 10.0.0.1, 2001:0db8:85a3:0000:0000:8a2e:0370:7334
  ip_address: [
    // IPv4
    /(?:^|\s)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?:\s|$|:|\/)/g,
    // IPv6
    /(?:^|\s)((?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4})(?:\s|$|\/)/g,
    // IPv6 compressed
    /(?:^|\s)((?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})(?:\s|$|\/)/g,
  ],

  // Passwords and secrets
  // Matches: password=secret123, --password secret123, -p secret123, password="my pass"
  password: [
    // password= format with quotes
    /(?:password|passwd|pwd|pass)\s*[=:]\s*["']([^"']+)["']/gi,
    // password= format without quotes
    /(?:password|passwd|pwd|pass)\s*[=:]\s*([^\s'"]+)/gi,
    // --password format with quotes
    /--(?:password|passwd|pwd|pass)\s+["']([^"']+)["']/gi,
    // --password format without quotes
    /--(?:password|passwd|pwd|pass)\s+([^\s'"]+)/gi,
    // -p format with quotes
    /-p\s+["']([^"']+)["']/g,
    // -p format without quotes
    /-p\s+([^\s'"]+)/g,
  ],

  // API keys
  // Matches: sk-..., api_key=..., token=...
  api_key: [
    // Common API key prefixes
    /(?:^|\s)((?:sk|pk|api|token)[-_][a-zA-Z0-9]{20,})(?:\s|$)/gi,
    // api_key= format
    /(?:api[-_]?key|token|secret)\s*[=:]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
  ],

  // Email addresses
  // Matches: user@example.com
  email: [
    /(?:^|\s)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\s|$)/g,
  ],
} as const;

/**
 * PrivacyFilter Implementation
 * Handles detection, sanitization, and restoration of sensitive information
 */
export class PrivacyFilter implements IPrivacyFilter {
  /**
   * Sanitize text by replacing sensitive information with placeholders
   * 
   * Requirements:
   * - 3.1: Replace file paths with placeholders
   * - 3.2: Replace IP addresses with placeholders
   * - 3.3: Replace passwords/keys with placeholders
   * - 3.5: Record mapping locally (not sent to server)
   */
  sanitize(text: string): SanitizedText {
    if (!text || text.trim().length === 0) {
      return {
        sanitized: text,
        mapping: {},
        detectedTypes: [],
      };
    }

    let sanitized = text;
    const mapping: SensitiveMapping = {};
    const detectedTypes = new Set<SensitiveType>();
    const counters: Record<SensitiveType, number> = {
      file_path: 0,
      ip_address: 0,
      password: 0,
      api_key: 0,
      email: 0,
    };

    // Detect all sensitive information first
    const sensitiveInfoList = this.detectSensitiveInfo(text);

    // Sort by start index in descending order to replace from end to start
    // This prevents index shifting issues
    sensitiveInfoList.sort((a, b) => b.startIndex - a.startIndex);

    // Replace each sensitive item with a placeholder
    for (const info of sensitiveInfoList) {
      counters[info.type]++;
      const placeholder = this.generatePlaceholder(info.type, counters[info.type]);
      
      // Store mapping
      mapping[placeholder] = info.value;
      detectedTypes.add(info.type);

      // Replace in text
      sanitized = 
        sanitized.substring(0, info.startIndex) +
        placeholder +
        sanitized.substring(info.endIndex);
    }

    return {
      sanitized,
      mapping,
      detectedTypes: Array.from(detectedTypes),
    };
  }

  /**
   * Restore sanitized text back to original using the mapping
   * 
   * Requirement 3.4: Restore placeholders to original values
   */
  restore(text: string, mapping: SensitiveMapping): string {
    if (!text || !mapping || Object.keys(mapping).length === 0) {
      return text;
    }

    let restored = text;

    // Replace all placeholders with original values
    for (const [placeholder, originalValue] of Object.entries(mapping)) {
      // Use global replace to handle multiple occurrences
      restored = restored.split(placeholder).join(originalValue);
    }

    return restored;
  }

  /**
   * Detect sensitive information in text
   * 
   * Identifies all sensitive information with their types and positions
   */
  detectSensitiveInfo(text: string): SensitiveInfo[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const detectedInfo: SensitiveInfo[] = [];

    // Check each sensitive type
    for (const [type, patterns] of Object.entries(SENSITIVE_PATTERNS)) {
      for (const pattern of patterns) {
        // Reset regex state
        pattern.lastIndex = 0;
        
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text)) !== null) {
          // Get the captured group (the actual sensitive value)
          const capturedValue = match[1];
          if (!capturedValue) continue;

          // Find the actual position of the captured value in the match
          const matchStart = match.index;
          const capturedStart = text.indexOf(capturedValue, matchStart);
          const capturedEnd = capturedStart + capturedValue.length;

          // Validate the detected value
          if (this.isValidSensitiveInfo(type as SensitiveType, capturedValue)) {
            detectedInfo.push({
              type: type as SensitiveType,
              value: capturedValue,
              startIndex: capturedStart,
              endIndex: capturedEnd,
            });
          }
        }
      }
    }

    // Remove duplicates and overlapping matches
    return this.deduplicateSensitiveInfo(detectedInfo);
  }

  /**
   * Generate a placeholder for a sensitive type
   */
  private generatePlaceholder(type: SensitiveType, counter: number): string {
    const typeMap: Record<SensitiveType, string> = {
      file_path: 'FILE',
      ip_address: 'IP',
      password: 'SECRET',
      api_key: 'KEY',
      email: 'EMAIL',
    };

    return `<${typeMap[type]}_${counter}>`;
  }

  /**
   * Validate if detected value is actually sensitive information
   * Filters out false positives
   */
  private isValidSensitiveInfo(type: SensitiveType, value: string): boolean {
    switch (type) {
      case 'file_path':
        // Must have at least one directory separator and reasonable length
        return (
          value.length > 3 &&
          (value.includes('/') || value.includes('\\')) &&
          !value.match(/^https?:\/\//) // Exclude URLs
        );

      case 'ip_address':
        // Validate IPv4 format
        if (value.includes('.')) {
          const parts = value.split('.');
          if (parts.length !== 4) return false;
          return parts.every(part => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
          });
        }
        // IPv6 is valid if it matches the pattern
        return value.includes(':');

      case 'password':
        // Must be at least 3 characters
        return value.length >= 3;

      case 'api_key':
        // Must be at least 20 characters
        return value.length >= 20;

      case 'email':
        // Basic email validation
        return value.includes('@') && value.includes('.');

      default:
        return true;
    }
  }

  /**
   * Remove duplicate and overlapping sensitive information
   * Keeps the most specific match when there are overlaps
   */
  private deduplicateSensitiveInfo(infoList: SensitiveInfo[]): SensitiveInfo[] {
    if (infoList.length <= 1) return infoList;

    // Sort by start index
    const sorted = [...infoList].sort((a, b) => a.startIndex - b.startIndex);
    const deduplicated: SensitiveInfo[] = [];

    for (const current of sorted) {
      // Check if this overlaps with any already added item
      const overlaps = deduplicated.some(existing => {
        return (
          (current.startIndex >= existing.startIndex && 
           current.startIndex < existing.endIndex) ||
          (current.endIndex > existing.startIndex && 
           current.endIndex <= existing.endIndex) ||
          (current.startIndex <= existing.startIndex && 
           current.endIndex >= existing.endIndex)
        );
      });

      if (!overlaps) {
        deduplicated.push(current);
      }
    }

    return deduplicated;
  }
}

/**
 * Create a singleton instance of PrivacyFilter
 */
export const privacyFilter = new PrivacyFilter();

/**
 * Export default instance
 */
export default privacyFilter;
