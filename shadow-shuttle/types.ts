export enum DeviceType {
  SERVER = 'server',
  DESKTOP = 'desktop',
  LAPTOP = 'laptop',
  CHIP = 'chip',
  PHONE = 'phone'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline'
}

export interface Device {
  id: string;
  name: string;
  ip: string;
  type: DeviceType;
  status: DeviceStatus;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  type: 'text' | 'command' | 'warning';
  metadata?: any;
  image?: string; // base64
}

export enum HistoryRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface HistoryEntry {
  id: string;
  device: string;
  action: string;
  command: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  risk: HistoryRiskLevel;
  output?: string;
}
