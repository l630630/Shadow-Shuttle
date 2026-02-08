import { Device, DeviceType, DeviceStatus, ChatMessage, HistoryEntry, HistoryRiskLevel } from './types';

export const MOCK_DEVICES: Device[] = [
  { id: '1', name: 'Ubuntu 服务器 01', ip: '192.168.1.45', type: DeviceType.SERVER, status: DeviceStatus.ONLINE },
  { id: '2', name: '家用台式机 (Win)', ip: '10.0.0.12', type: DeviceType.DESKTOP, status: DeviceStatus.ONLINE },
  { id: '3', name: 'MacBook Pro M1', ip: '192.168.1.10', type: DeviceType.LAPTOP, status: DeviceStatus.OFFLINE },
  { id: '4', name: 'Pi-Hole DNS', ip: '192.168.1.200', type: DeviceType.CHIP, status: DeviceStatus.ONLINE },
  { id: '5', name: 'Pixel 7 手机', ip: '10.0.0.45', type: DeviceType.PHONE, status: DeviceStatus.ONLINE },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: '清理 /var/log 目录下的旧日志文件。',
    timestamp: '10:23 AM',
    type: 'text'
  },
  {
    id: 'msg-2',
    role: 'model',
    content: '没问题。我已经为你准备了一个命令，可以删除该目录下所有的 .log 文件。',
    timestamp: '10:23 AM',
    type: 'text'
  },
  {
    id: 'msg-3',
    role: 'model',
    content: 'cd /var/log && rm *.log',
    timestamp: '10:23 AM',
    type: 'command',
    metadata: {
      user: 'root',
      host: 'Alpha-Node-04',
      path: '~'
    }
  },
  {
    id: 'msg-4',
    role: 'model',
    content: '此操作是不可逆的。执行 rm *.log 将永久删除文件，请谨慎操作。',
    timestamp: '10:23 AM',
    type: 'warning',
    metadata: {
      riskLevel: 'high',
      command: 'rm *.log'
    }
  }
];

export const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: 'h-1',
    device: 'BASTION-01',
    action: '更新堡垒机上的所有软件包',
    command: 'sudo apt-get update && sudo apt-get upgrade -y',
    timestamp: '2分钟前',
    status: 'success',
    risk: HistoryRiskLevel.LOW
  },
  {
    id: 'h-2',
    device: 'LB-NODE-03',
    action: '重启 Nginx 服务',
    command: 'systemctl restart nginx',
    timestamp: '45分钟前',
    status: 'warning',
    risk: HistoryRiskLevel.MEDIUM
  },
  {
    id: 'h-3',
    device: 'NODE-04',
    action: '清空节点 4 的 iptables 规则',
    command: 'sudo iptables -F',
    timestamp: '1小时前',
    status: 'error',
    risk: HistoryRiskLevel.HIGH,
    output: `user@node-04:~$ sudo iptables -F
iptables: 正在清空防火墙规则...
警告：连接可能会中断。
链 INPUT 策略设为 ACCEPT。
链 FORWARD 策略设为 ACCEPT。
链 OUTPUT 策略设为 ACCEPT。
错误：与远程主机 192.168.1.44 的连接已断开`
  },
  {
    id: 'h-4',
    device: 'DB-REPLICA-01',
    action: '创建主数据库备份',
    command: 'pg_dump -U admin -h localhost main_db > backup.sql',
    timestamp: '3小时前',
    status: 'success',
    risk: HistoryRiskLevel.LOW
  },
  {
    id: 'h-5',
    device: 'GATEWAY-02',
    action: '检查磁盘空间使用情况',
    command: 'df -h',
    timestamp: '5小时前',
    status: 'success',
    risk: HistoryRiskLevel.LOW
  }
];
