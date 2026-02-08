/**
 * SSH Connection Service
 * Manages SSH connections to remote devices via WebSocket
 */

import { Device } from '../types/device';

export interface SSHConnectionConfig {
  host: string;
  port: number;
  username: string;
  privateKey?: string;
  password?: string;
}

export interface SSHSession {
  id: string;
  device: Device;
  connected: boolean;
  ws?: WebSocket;
  buffer: string;
  heartbeatInterval?: NodeJS.Timeout; // 心跳定时器
}

export type SSHDataCallback = (data: string) => void;
export type SSHErrorCallback = (error: Error) => void;
export type SSHCloseCallback = () => void;

export class SSHService {
  private sessions: Map<string, SSHSession> = new Map();
  private dataCallbacks: Map<string, Set<SSHDataCallback>> = new Map();
  private errorCallbacks: Map<string, SSHErrorCallback> = new Map();
  private closeCallbacks: Map<string, SSHCloseCallback> = new Map();
  
  // WebSocket proxy server configuration
  // Will be dynamically set based on device IP
  private proxyServerUrl = 'ws://192.168.2.57:8022'; // Default to Mac's LAN IP
  
  // Use real SSH connection via WebSocket proxy
  private useRealSSH = true; // 启用真实 SSH 连接
  
  /**
   * Connect to a device via SSH
   * Uses direct TCP connection to SSH server
   */
  async connect(
    device: Device,
    config: SSHConnectionConfig
  ): Promise<string> {
    const sessionId = `ssh-${device.id}-${Date.now()}`;
    
    try {
      // Dynamically set proxy server URL based on device IP
      // Use WebSocket proxy port (8022) instead of SSH port
      this.proxyServerUrl = `ws://${config.host}:8022`;
      
      const session: SSHSession = {
        id: sessionId,
        device,
        connected: false,
        buffer: '',
      };
      
      this.sessions.set(sessionId, session);
      
      if (this.useRealSSH) {
        // Use real SSH connection via TCP
        await this.connectRealSSH(sessionId, config);
      } else {
        // Fallback to simulation
        await this.connectSimulated(sessionId);
      }
      
      session.connected = true;
      return sessionId;
    } catch (error) {
      this.sessions.delete(sessionId);
      throw new Error(
        error instanceof Error ? error.message : 'SSH connection failed'
      );
    }
  }
  
  /**
   * Connect to real SSH server using WebSocket proxy
   */
  private async connectRealSSH(
    sessionId: string,
    config: SSHConnectionConfig
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    return new Promise((resolve, reject) => {
      console.log(`Connecting to WebSocket proxy at ${this.proxyServerUrl}...`);
      
      // Create WebSocket connection to proxy server
      const ws = new WebSocket(this.proxyServerUrl);
      session.ws = ws;
      
      let connectionTimeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 10000); // 10 second timeout
      
      ws.onopen = () => {
        console.log('WebSocket connected to proxy server');
        
        // Send SSH connection request
        // Connect to the Mac's SSH server directly
        ws.send(JSON.stringify({
          type: 'connect',
          host: config.host, // Mac's IP address
          port: 2222, // SSH server port
          username: config.username,
          password: config.password,
          privateKey: config.privateKey,
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              clearTimeout(connectionTimeout);
              console.log('SSH connection established via proxy');
              
              // 启动心跳，每 30 秒发送一次空数据包保持连接
              session.heartbeatInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  // 发送一个空字符，保持连接活跃
                  ws.send(JSON.stringify({
                    type: 'data',
                    data: '', // 空数据
                  }));
                }
              }, 30000); // 30 秒
              
              resolve();
              break;
              
            case 'data':
              // Forward SSH output to all callbacks
              const callbacks = this.dataCallbacks.get(sessionId);
              if (callbacks) {
                callbacks.forEach(callback => callback(message.data));
              }
              break;
              
            case 'error':
              console.error('SSH error:', message.message);
              const errorCallback = this.errorCallbacks.get(sessionId);
              if (errorCallback) {
                errorCallback(new Error(message.message));
              }
              
              // If error during connection, reject
              if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                reject(new Error(message.message));
              }
              break;
              
            case 'closed':
              console.log('SSH connection closed by server');
              const closeCallback = this.closeCallbacks.get(sessionId);
              if (closeCallback) {
                closeCallback();
              }
              ws.close();
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.log('WebSocket error:', error); // 改为 log 而不是 error，避免红屏
        
        // 如果还在连接阶段，才 reject
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          reject(new Error('WebSocket connection failed'));
        } else {
          // 连接已建立后的错误，通知错误回调
          const errorCallback = this.errorCallbacks.get(sessionId);
          if (errorCallback) {
            errorCallback(new Error('WebSocket connection error'));
          }
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket connection closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        session.connected = false;
        
        // 清理心跳定时器
        if (session.heartbeatInterval) {
          clearInterval(session.heartbeatInterval);
          session.heartbeatInterval = undefined;
        }
        
        const closeCallback = this.closeCallbacks.get(sessionId);
        if (closeCallback) {
          closeCallback();
        }
      };
    });
  }
  
  /**
   * Connect using simulated SSH (fallback)
   */
  private async connectSimulated(sessionId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const session = this.sessions.get(sessionId);
    const callbacks = this.dataCallbacks.get(sessionId);
    if (!session || !callbacks) return;
    
    // Send welcome message to all callbacks
    const welcomeMsg = `\x1b[32m✓ 已连接到 ${session.device.name}\x1b[0m\n`;
    const promptMsg = `\x1b[36m${session.device.hostname}\x1b[0m:\x1b[34m~\x1b[0m$ `;
    callbacks.forEach(callback => {
      callback(welcomeMsg);
      callback(promptMsg);
    });
  }
  
  /**
   * Disconnect from SSH session
   */
  async disconnect(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    
    try {
      // 清理心跳定时器
      if (session.heartbeatInterval) {
        clearInterval(session.heartbeatInterval);
        session.heartbeatInterval = undefined;
      }
      
      // Close WebSocket connection if using real SSH
      if (session.ws) {
        session.ws.send(JSON.stringify({ type: 'disconnect' }));
        session.ws.close();
      }
      
      session.connected = false;
      this.sessions.delete(sessionId);
      
      // Cleanup callbacks
      this.dataCallbacks.delete(sessionId);
      this.errorCallbacks.delete(sessionId);
      
      // Notify close callback
      const closeCallback = this.closeCallbacks.get(sessionId);
      if (closeCallback) {
        closeCallback();
      }
      this.closeCallbacks.delete(sessionId);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'SSH disconnection failed'
      );
    }
  }
  
  /**
   * Write data to SSH session (send command)
   */
  async write(sessionId: string, data: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.connected) {
      throw new Error('Session not connected');
    }
    
    try {
      if (this.useRealSSH && session.ws) {
        // Send directly through WebSocket (real SSH)
        session.ws.send(JSON.stringify({
          type: 'data',
          data: data,
        }));
      } else {
        // Fallback to simulation
        const callbacks = this.dataCallbacks.get(sessionId);
        if (!callbacks) return;
        
        // Echo the command (terminal behavior)
        callbacks.forEach(callback => callback(data));
        
        // Execute command
        const command = data.trim();
        if (command) {
          await this.simulateCommandExecution(sessionId, command);
        } else {
          // Just show prompt for empty command
          const promptMsg = `\x1b[36m${session.device.hostname}\x1b[0m:\x1b[34m~\x1b[0m$ `;
          callbacks.forEach(callback => callback(promptMsg));
        }
      }
    } catch (error) {
      const errorCallback = this.errorCallbacks.get(sessionId);
      if (errorCallback) {
        errorCallback(
          error instanceof Error ? error : new Error('Write failed')
        );
      }
    }
  }
  
  /**
   * Execute real command via SSH through WebSocket proxy
   */
  private async executeRealCommand(
    sessionId: string,
    command: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.ws) {
      throw new Error('Session not connected');
    }
    
    try {
      // Send command through WebSocket to proxy server
      session.ws.send(JSON.stringify({
        type: 'data',
        data: command + '\n',
      }));
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to send command'
      );
    }
  }
  
  /**
   * Execute command locally (for demo)
   * In production, this would be sent to SSH server
   */
  private async executeCommandLocally(sessionId: string, command: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    
    // Parse command
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    switch (cmd) {
      case 'ls':
        if (args.includes('-la') || args.includes('-l')) {
          return '\ndrwxr-xr-x  5 user user 4096 Jan 29 12:00 \x1b[34mDocuments\x1b[0m\n' +
                 'drwxr-xr-x  3 user user 4096 Jan 28 10:30 \x1b[34mDownloads\x1b[0m\n' +
                 'drwxr-xr-x  2 user user 4096 Jan 27 15:20 \x1b[34mPictures\x1b[0m\n' +
                 '-rw-r--r--  1 user user  156 Jan 29 11:45 \x1b[32mREADME.md\x1b[0m\n' +
                 '-rwxr-xr-x  1 user user 2048 Jan 28 09:00 \x1b[31mshadowd\x1b[0m\n';
        }
        return '\n\x1b[34mDocuments\x1b[0m  \x1b[34mDownloads\x1b[0m  \x1b[34mPictures\x1b[0m  \x1b[32mREADME.md\x1b[0m  \x1b[31mshadowd\x1b[0m\n';
      
      case 'pwd':
        return '\n/home/user\n';
      
      case 'whoami':
        return '\nuser\n';
      
      case 'hostname':
        return '\n' + (session?.device.hostname || 'localhost') + '\n';
      
      case 'date':
        return '\n' + new Date().toString() + '\n';
      
      case 'uname':
        if (args.includes('-a')) {
          return '\nLinux shadowd 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux\n';
        }
        return '\nLinux\n';
      
      case 'echo':
        return '\n' + args.join(' ') + '\n';
      
      case 'cat':
        if (args[0] === 'README.md') {
          return '\n# 影梭 Shadow Shuttle\n\n通过 Mesh 网络实现安全的 SSH 访问。\n\n' +
                 '## 功能特性\n- WireGuard VPN\n- SSH 访问\n- 设备发现\n';
        }
        return `\ncat: ${args[0]}: 没有那个文件或目录\n`;
      
      case 'ps':
        return '\n  PID TTY          TIME CMD\n' +
               ' 1234 pts/0    00:00:00 bash\n' +
               ' 5678 pts/0    00:00:00 shadowd\n' +
               ' 9012 pts/0    00:00:00 ps\n';
      
      case 'df':
        return '\nFilesystem     1K-blocks    Used Available Use% Mounted on\n' +
               '/dev/sda1       51474912 8234560  40596608  17% /\n' +
               'tmpfs            4096000       0   4096000   0% /tmp\n';
      
      case 'free':
        return '\n              total        used        free      shared  buff/cache   available\n' +
               'Mem:        8192000     2048000     4096000      128000     2048000     5888000\n' +
               'Swap:       2048000           0     2048000\n';
      
      case 'uptime':
        return '\n 12:34:56 up 5 days,  3:21,  1 user,  load average: 0.15, 0.10, 0.08\n';
      
      case 'clear':
        return '\x1b[2J\x1b[H'; // ANSI clear screen
      
      case 'help':
        return '\n\x1b[1m可用命令:\x1b[0m\n' +
               '  ls, pwd, whoami, hostname, date, uname\n' +
               '  echo, cat, ps, df, free, uptime, clear\n' +
               '  help, exit\n';
      
      case 'rm':
        if (args.length === 0) {
          return '\nrm: 缺少操作数\n';
        }
        // Simulate file deletion
        const filePath = args[args.length - 1];
        return `\n已删除 '${filePath}'\n`;
      
      case 'mkdir':
        if (args.length === 0) {
          return '\nmkdir: 缺少操作数\n';
        }
        return `\n已创建目录 '${args[args.length - 1]}'\n`;
      
      case 'touch':
        if (args.length === 0) {
          return '\ntouch: 缺少操作数\n';
        }
        return `\n已创建文件 '${args[args.length - 1]}'\n`;
      
      case 'cp':
        if (args.length < 2) {
          return '\ncp: 缺少目标文件操作数\n';
        }
        return `\n已复制 '${args[0]}' 到 '${args[1]}'\n`;
      
      case 'mv':
        if (args.length < 2) {
          return '\nmv: 缺少目标文件操作数\n';
        }
        return `\n已移动 '${args[0]}' 到 '${args[1]}'\n`;
      
      case 'exit':
        return '\n退出登录\n';
      
      default:
        return `\n\x1b[31m${cmd}: 命令未找到\x1b[0m\n`;
    }
  }
  
  /**
   * Simulate command execution (fallback)
   */
  private async simulateCommandExecution(
    sessionId: string,
    command: string
  ): Promise<void> {
    const callbacks = this.dataCallbacks.get(sessionId);
    const session = this.sessions.get(sessionId);
    if (!callbacks || !session) return;
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Use the same command execution logic
    const result = await this.executeCommandLocally(sessionId, command);
    callbacks.forEach(callback => callback(result));
    
    // Show prompt
    const promptMsg = `\x1b[36m${session.device.hostname}\x1b[0m:\x1b[34m~\x1b[0m$ `;
    callbacks.forEach(callback => callback(promptMsg));
  }
  
  /**
   * Register callback for receiving data
   */
  onData(sessionId: string, callback: SSHDataCallback): void {
    if (!this.dataCallbacks.has(sessionId)) {
      this.dataCallbacks.set(sessionId, new Set());
    }
    this.dataCallbacks.get(sessionId)!.add(callback);
  }
  
  /**
   * Unregister data callback
   */
  offData(sessionId: string, callback: SSHDataCallback): void {
    const callbacks = this.dataCallbacks.get(sessionId);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.dataCallbacks.delete(sessionId);
      }
    }
  }
  
  /**
   * Register callback for errors
   */
  onError(sessionId: string, callback: SSHErrorCallback): void {
    this.errorCallbacks.set(sessionId, callback);
  }
  
  /**
   * Register callback for connection close
   */
  onClose(sessionId: string, callback: SSHCloseCallback): void {
    this.closeCallbacks.set(sessionId, callback);
  }
  
  /**
   * Check if session is connected
   */
  isConnected(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session ? session.connected : false;
  }
  
  /**
   * Get session info
   */
  getSession(sessionId: string): SSHSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Get all active sessions
   */
  getActiveSessions(): SSHSession[] {
    return Array.from(this.sessions.values());
  }
}

// Singleton instance
let sshServiceInstance: SSHService | null = null;

/**
 * Get SSH service singleton instance
 */
export function getSSHService(): SSHService {
  if (!sshServiceInstance) {
    sshServiceInstance = new SSHService();
  }
  return sshServiceInstance;
}
