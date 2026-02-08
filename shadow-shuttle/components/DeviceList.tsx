import React from 'react';
import { Device, DeviceStatus, DeviceType } from '../types';

interface DeviceListProps {
  devices: Device[];
  onDeviceClick?: (device: Device) => void;
}

const getDeviceIcon = (type: DeviceType) => {
  switch (type) {
    case DeviceType.SERVER: return 'dns';
    case DeviceType.DESKTOP: return 'desktop_windows';
    case DeviceType.LAPTOP: return 'laptop_mac';
    case DeviceType.CHIP: return 'memory';
    case DeviceType.PHONE: return 'smartphone';
    default: return 'devices';
  }
};

const getDeviceColor = (type: DeviceType) => {
  switch (type) {
    case DeviceType.SERVER: return 'text-orange-500 bg-orange-500/20';
    case DeviceType.DESKTOP: return 'text-blue-500 bg-blue-500/20';
    case DeviceType.LAPTOP: return 'text-slate-300 bg-slate-700';
    case DeviceType.CHIP: return 'text-pink-500 bg-pink-500/20';
    case DeviceType.PHONE: return 'text-indigo-500 bg-indigo-500/20';
    default: return 'text-slate-400 bg-slate-800';
  }
};

const DeviceList: React.FC<DeviceListProps> = ({ devices, onDeviceClick }) => {
  return (
    <div className="flex flex-col gap-3 pb-24">
      {devices.map((device) => {
        const isOnline = device.status === DeviceStatus.ONLINE;
        return (
          <div
            key={device.id}
            onClick={() => onDeviceClick && onDeviceClick(device)}
            className={`group relative flex items-center justify-between p-4 rounded-xl bg-surface border border-surface shadow-sm active:scale-[0.98] transition-transform duration-200 cursor-pointer hover:border-primary/50 ${!isOnline ? 'opacity-80' : ''}`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={`flex items-center justify-center shrink-0 size-12 rounded-lg ${getDeviceColor(device.type)}`}>
                <span className="material-symbols-outlined">{getDeviceIcon(device.type)}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-base font-semibold text-white truncate">{device.name}</p>
                <p className="text-slate-400 text-xs font-mono truncate">{device.ip}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-2 shrink-0">
              <span className={`hidden sm:block text-xs font-medium ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isOnline ? '在线' : '离线'}
              </span>
              <div className={`size-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-glow-green' : 'bg-slate-600'}`}></div>
              <span className="material-symbols-outlined text-slate-500 text-xl ml-1 group-hover:text-primary transition-colors">chevron_right</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DeviceList;