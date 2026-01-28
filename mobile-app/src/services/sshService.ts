/**
 * SSH Connection Service
 * Manages SSH connections to remote devices
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
  shell?: any;
}

export type SSHDataCallback = (data: string) => void;
export type SSHErrorCallback = (error: Error) => void;
export type SSHCloseCallback = () => void;

export class SSHService {
  private sessions: Map<string, SSHSession> = new Map();
  private dataCallbacks: Map<string, SSHDataCallback> = new Map();
  private errorCallbacks: Map<string, SSHErrorCallback> = new Map();
  private closeCallbacks: Map<string, SSHCloseCallback> = new Map();
  
  /**
   * Connect to a device via SSH
   */
  async connect(
    device: Device,
    config: SSHConnectionConfig
  ): Promise<string> {
    const sessionId = `ssh-${device.id}-${Date.now()}`;
    
    try {
      // TODO: Implement actual SSH connection using react-native-ssh
      // This is a placeholder implementation
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const session: SSHSession = {
        id: sessionId,
        device,
        connected: true,
        shell: null, // Placeholder for actual shell
      };
      
      this.sessions.set(sessionId, session);
      
      // Start shell
      await this.startShell(sessionId);
      
      return sessionId;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'SSH connection failed'
      );
    }
  }
  
  /**
   * Start an interactive shell session
   */
  private async startShell(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // TODO: Implement actual shell startup
    // This would create a PTY and start the shell
    
    // Simulate shell startup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send welcome message
    const callback = this.dataCallbacks.get(sessionId);
    if (callback) {
      callback(`Welcome to ${session.device.name}\n`);
      callback(`${session.device.hostname}:~$ `);
    }
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
      // TODO: Implement actual SSH disconnection
      // This would close the shell and connection
      
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
      // TODO: Implement actual data writing to SSH shell
      
      // Echo the command back (simulating terminal behavior)
      const callback = this.dataCallbacks.get(sessionId);
      if (callback) {
        callback(data);
        
        // Simulate command execution
        if (data.trim()) {
          await this.simulateCommandExecution(sessionId, data.trim());
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
   * Simulate command execution (placeholder)
   */
  private async simulateCommandExecution(
    sessionId: string,
    command: string
  ): Promise<void> {
    const callback = this.dataCallbacks.get(sessionId);
    if (!callback) return;
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simulate some common commands
    if (command === 'ls') {
      callback('\nDocuments  Downloads  Pictures  Videos\n');
    } else if (command === 'pwd') {
      callback('\n/home/user\n');
    } else if (command.startsWith('echo ')) {
      callback('\n' + command.substring(5) + '\n');
    } else if (command === 'whoami') {
      callback('\nuser\n');
    } else if (command === 'date') {
      callback('\n' + new Date().toString() + '\n');
    } else {
      callback(`\n${command}: command not found\n`);
    }
    
    // Show prompt
    const session = this.sessions.get(sessionId);
    if (session) {
      callback(`${session.device.hostname}:~$ `);
    }
  }
  
  /**
   * Register callback for receiving data
   */
  onData(sessionId: string, callback: SSHDataCallback): void {
    this.dataCallbacks.set(sessionId, callback);
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
