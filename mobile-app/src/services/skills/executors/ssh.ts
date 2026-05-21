import { getSSHService } from '../../sshService';

export async function sshRun(sessionId: string, command: string): Promise<void> {
  const ssh = getSSHService();
  if (!ssh.isConnected(sessionId)) {
    throw new Error('SSH 会话未连接');
  }
  await ssh.write(sessionId, command.endsWith('\n') ? command : command + '\n');
}

