/**
 * Output Formatter Utility
 * 输出格式化工具
 * 
 * Cleans and formats command output for better display in chat interface.
 * 清理和格式化命令输出，以便在聊天界面中更好地显示。
 */

/**
 * File type information
 * 文件类型信息
 */
export interface FileInfo {
  name: string;
  type: 'file' | 'directory' | 'link' | 'executable';
  icon: string;
  size?: string;
  permissions?: string;
  modified?: string;
}

/**
 * Clean terminal output by removing ANSI codes and control sequences
 * 清理终端输出，移除 ANSI 代码和控制序列
 * 
 * @param output Raw terminal output
 * @returns Cleaned output
 */
export function cleanTerminalOutput(output: string): string {
  return output
    // Remove ANSI color codes (e.g., \x1b[32m, \x1b[0m)
    .replace(/\x1b\[[0-9;]*m/g, '')
    
    // Remove ANSI cursor movement (e.g., \x1b[H, \x1b[2J)
    .replace(/\x1b\[[0-9;]*[HJK]/g, '')
    
    // Remove terminal mode switches (e.g., [?2004l, [?2004h)
    .replace(/\x1b\[\?[0-9]+[hl]/g, '')
    
    // Remove other ANSI escape sequences
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
    
    // Remove bell character
    .replace(/\x07/g, '')
    
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    
    // Remove excessive blank lines (more than 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    
    // Trim whitespace
    .trim();
}

/**
 * Parse ls command output and extract file information
 * 解析 ls 命令输出并提取文件信息
 * 
 * @param output ls command output
 * @returns Array of file information
 */
export function parseLsOutput(output: string): FileInfo[] {
  const lines = output.split('\n').filter(line => line.trim());
  const files: FileInfo[] = [];
  
  for (const line of lines) {
    // Skip total line
    if (line.startsWith('total ')) continue;
    
    // Parse ls -l format
    const longFormatMatch = line.match(/^([drwx-]+)\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\S+\s+\d+\s+[\d:]+)\s+(.+)$/);
    
    if (longFormatMatch) {
      const [, permissions, size, modified, name] = longFormatMatch;
      const isDirectory = permissions.startsWith('d');
      const isLink = permissions.startsWith('l');
      const isExecutable = permissions.includes('x') && !isDirectory;
      
      files.push({
        name,
        type: isDirectory ? 'directory' : isLink ? 'link' : isExecutable ? 'executable' : 'file',
        icon: getFileIcon(name, isDirectory, isExecutable),
        size: formatFileSize(parseInt(size)),
        permissions,
        modified,
      });
    } else {
      // Simple format (just filename)
      const name = line.trim();
      if (name) {
        const isDirectory = name.endsWith('/');
        const isExecutable = name.endsWith('*');
        const cleanName = name.replace(/[/*@]$/, '');
        
        files.push({
          name: cleanName,
          type: isDirectory ? 'directory' : isExecutable ? 'executable' : 'file',
          icon: getFileIcon(cleanName, isDirectory, isExecutable),
        });
      }
    }
  }
  
  return files;
}

/**
 * Get appropriate icon for file type
 * 获取文件类型对应的图标
 * 
 * @param filename File name
 * @param isDirectory Is directory
 * @param isExecutable Is executable
 * @returns Icon emoji
 */
export function getFileIcon(filename: string, isDirectory: boolean, isExecutable: boolean): string {
  if (isDirectory) {
    // Special directory icons
    if (filename === 'Desktop') return '🖥️';
    if (filename === 'Documents') return '📄';
    if (filename === 'Downloads') return '⬇️';
    if (filename === 'Pictures' || filename === 'Images') return '🖼️';
    if (filename === 'Music') return '🎵';
    if (filename === 'Videos') return '🎬';
    if (filename === 'Public') return '🌐';
    if (filename.startsWith('.')) return '📁'; // Hidden folder
    return '📁';
  }
  
  if (isExecutable) {
    return '⚙️';
  }
  
  // Get file extension
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(ext)) {
    return '🖼️';
  }
  
  // Video files
  if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
    return '🎬';
  }
  
  // Audio files
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext)) {
    return '🎵';
  }
  
  // Document files
  if (['pdf'].includes(ext)) {
    return '📕';
  }
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
    return '📘';
  }
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) {
    return '📊';
  }
  if (['ppt', 'pptx', 'odp'].includes(ext)) {
    return '📽️';
  }
  
  // Code files
  if (['js', 'jsx', 'ts', 'tsx', 'json'].includes(ext)) {
    return '📜';
  }
  if (['py', 'pyc', 'pyo'].includes(ext)) {
    return '🐍';
  }
  if (['java', 'class', 'jar'].includes(ext)) {
    return '☕';
  }
  if (['c', 'cpp', 'h', 'hpp'].includes(ext)) {
    return '⚡';
  }
  if (['go'].includes(ext)) {
    return '🐹';
  }
  if (['rs'].includes(ext)) {
    return '🦀';
  }
  if (['php'].includes(ext)) {
    return '🐘';
  }
  if (['rb'].includes(ext)) {
    return '💎';
  }
  if (['swift'].includes(ext)) {
    return '🦅';
  }
  if (['kt', 'kts'].includes(ext)) {
    return '🅺';
  }
  
  // Web files
  if (['html', 'htm'].includes(ext)) {
    return '🌐';
  }
  if (['css', 'scss', 'sass', 'less'].includes(ext)) {
    return '🎨';
  }
  
  // Config files
  if (['yaml', 'yml', 'toml', 'ini', 'conf', 'config'].includes(ext)) {
    return '⚙️';
  }
  if (['xml'].includes(ext)) {
    return '📋';
  }
  
  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
    return '📦';
  }
  
  // Text files
  if (['txt', 'md', 'markdown', 'log'].includes(ext)) {
    return '📝';
  }
  
  // Database files
  if (['db', 'sqlite', 'sql'].includes(ext)) {
    return '🗄️';
  }
  
  // Hidden files
  if (filename.startsWith('.')) {
    return '👁️';
  }
  
  // Default
  return '📄';
}

/**
 * Format file size to human-readable format
 * 格式化文件大小为人类可读格式
 * 
 * @param bytes File size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format ls output for better display
 * 格式化 ls 输出以便更好地显示
 * 
 * @param output Raw ls output
 * @returns Formatted output with icons
 */
export function formatLsOutput(output: string): string {
  const files = parseLsOutput(output);
  
  if (files.length === 0) {
    return output; // Return original if parsing failed
  }
  
  // Sort: directories first, then files
  files.sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });
  
  // Format output
  let formatted = '';
  
  for (const file of files) {
    const icon = file.icon;
    const name = file.name;
    const size = file.size ? ` (${file.size})` : '';
    
    formatted += `${icon} ${name}${size}\n`;
  }
  
  return formatted.trim();
}

/**
 * Detect command type from command string
 * 从命令字符串检测命令类型
 * 
 * @param command Command string
 * @returns Command type
 */
export function detectCommandType(command: string): 'ls' | 'cat' | 'grep' | 'find' | 'ps' | 'df' | 'free' | 'top' | 'other' {
  const cmd = command.trim().split(/\s+/)[0];
  
  if (cmd === 'ls' || cmd === 'll' || cmd === 'dir') return 'ls';
  if (cmd === 'cat' || cmd === 'less' || cmd === 'more') return 'cat';
  if (cmd === 'grep' || cmd === 'egrep' || cmd === 'fgrep') return 'grep';
  if (cmd === 'find') return 'find';
  if (cmd === 'ps') return 'ps';
  if (cmd === 'df') return 'df';
  if (cmd === 'free') return 'free';
  if (cmd === 'top' || cmd === 'htop') return 'top';
  
  return 'other';
}

/**
 * Format command output based on command type
 * 根据命令类型格式化命令输出
 * 
 * @param output Raw command output
 * @param command Original command
 * @returns Formatted output
 */
export function formatCommandOutput(output: string, command: string): string {
  // First, clean the output
  const cleaned = cleanTerminalOutput(output);
  
  // Detect command type
  const cmdType = detectCommandType(command);
  
  // Apply specific formatting
  switch (cmdType) {
    case 'ls':
      return formatLsOutput(cleaned);
    
    case 'cat':
      // Add line numbers for cat output
      return addLineNumbers(cleaned);
    
    case 'grep':
      // Highlight matched lines
      return highlightGrepMatches(cleaned);
    
    case 'ps':
      // Format process list
      return formatProcessList(cleaned);
    
    case 'df':
      // Format disk usage
      return formatDiskUsage(cleaned);
    
    case 'free':
      // Format memory usage
      return formatMemoryUsage(cleaned);
    
    default:
      return cleaned;
  }
}

/**
 * Add line numbers to output
 * 为输出添加行号
 */
function addLineNumbers(output: string): string {
  const lines = output.split('\n');
  return lines
    .map((line, index) => `${(index + 1).toString().padStart(4, ' ')} │ ${line}`)
    .join('\n');
}

/**
 * Highlight grep matches (simplified)
 * 高亮 grep 匹配项（简化版）
 */
function highlightGrepMatches(output: string): string {
  // In a real implementation, you would parse the grep output
  // and highlight the matched text
  return output;
}

/**
 * Format process list
 * 格式化进程列表
 */
function formatProcessList(output: string): string {
  const lines = output.split('\n');
  if (lines.length === 0) return output;
  
  // Add emoji to header
  if (lines[0].includes('PID')) {
    lines[0] = '🔧 ' + lines[0];
  }
  
  return lines.join('\n');
}

/**
 * Format disk usage
 * 格式化磁盘使用情况
 */
function formatDiskUsage(output: string): string {
  const lines = output.split('\n');
  if (lines.length === 0) return output;
  
  // Add emoji to header
  if (lines[0].includes('Filesystem')) {
    lines[0] = '💾 ' + lines[0];
  }
  
  return lines.join('\n');
}

/**
 * Format memory usage
 * 格式化内存使用情况
 */
function formatMemoryUsage(output: string): string {
  const lines = output.split('\n');
  if (lines.length === 0) return output;
  
  // Add emoji to different sections
  return lines
    .map(line => {
      if (line.includes('Mem:')) return '🧠 ' + line;
      if (line.includes('Swap:')) return '💿 ' + line;
      return line;
    })
    .join('\n');
}

/**
 * Truncate long output
 * 截断过长的输出
 * 
 * @param output Output string
 * @param maxLines Maximum number of lines
 * @returns Truncated output
 */
export function truncateOutput(output: string, maxLines: number = 100): string {
  const lines = output.split('\n');
  
  if (lines.length <= maxLines) {
    return output;
  }
  
  const truncated = lines.slice(0, maxLines).join('\n');
  const remaining = lines.length - maxLines;
  
  return `${truncated}\n\n... (还有 ${remaining} 行，输出已截断)`;
}

/**
 * Check if output is too long
 * 检查输出是否过长
 */
export function isOutputTooLong(output: string, maxLength: number = 10000): boolean {
  return output.length > maxLength;
}
