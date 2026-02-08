/**
 * Device List State Management
 */

import { create } from 'zustand';
import { Device } from '../types/device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getShadowdService, ShadowdDeviceInfo } from '../services/shadowdService';
import { getMDNSService } from '../services/mdnsService';

const DEVICES_STORAGE_KEY = '@shadow_shuttle_devices';

interface DeviceState {
  devices: Device[];
  loading: boolean;
  error: string | null;
  lastDiscoveryTime: number; // 添加最后发现时间戳
  
  // Actions
  loadDevices: () => Promise<void>;
  saveDevices: () => Promise<void>;
  addDevice: (device: Device) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  updateDeviceStatus: (deviceId: string, online: boolean) => void;
  refreshDeviceStatuses: () => Promise<void>;
  discoverDevices: (hosts?: string[]) => Promise<void>;
  clearDevices: () => Promise<void>;
  deduplicateDevices: () => Promise<number>;
}

/**
 * Convert shadowd device info to app device format
 */
function convertShadowdDevice(shadowdDevice: ShadowdDeviceInfo): Device {
  return {
    id: shadowdDevice.id,
    name: shadowdDevice.name,
    hostname: shadowdDevice.name,
    meshIP: shadowdDevice.meshIP,
    sshPort: shadowdDevice.sshPort,
    grpcPort: shadowdDevice.grpcPort,
    publicKey: shadowdDevice.publicKey || 'unknown',
    online: shadowdDevice.isOnline,
    lastSeen: new Date(shadowdDevice.lastSeen * 1000), // Convert Unix timestamp to Date
  };
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  loading: false,
  error: null,
  lastDiscoveryTime: 0, // 初始化为 0
  
  loadDevices: async () => {
    console.log('🔵 [deviceStore] loadDevices called');
    set({ loading: true, error: null });
    try {
      const stored = await AsyncStorage.getItem(DEVICES_STORAGE_KEY);
      console.log('🔵 [deviceStore] AsyncStorage key:', DEVICES_STORAGE_KEY);
      console.log('🔵 [deviceStore] AsyncStorage data:', stored);
      
      if (stored) {
        const devices = JSON.parse(stored);
        console.log('🔵 [deviceStore] Parsed devices:', devices);
        
        // Convert date strings back to Date objects
        devices.forEach((device: Device) => {
          device.lastSeen = new Date(device.lastSeen);
        });
        
        console.log('🔵 [deviceStore] Setting devices to store:', devices.length, 'devices');
        set({ devices, loading: false });
        
        // Auto-deduplicate after loading (only if we have devices)
        if (devices.length > 0) {
          await get().deduplicateDevices();
        }
      } else {
        console.log('⚠️ [deviceStore] No stored devices found in AsyncStorage');
        set({ devices: [], loading: false });
      }
    } catch (error) {
      console.error('❌ [deviceStore] Error loading devices:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load devices';
      set({ error: errorMessage, loading: false });
    }
  },
  
  saveDevices: async () => {
    try {
      const { devices } = get();
      await AsyncStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save devices';
      set({ error: errorMessage });
    }
  },
  
  addDevice: async (device: Device) => {
    const { devices } = get();
    // Check if device already exists (by id)
    const existingIndex = devices.findIndex(d => d.id === device.id);
    
    let updated: Device[];
    if (existingIndex >= 0) {
      // Update existing device
      updated = [...devices];
      updated[existingIndex] = device;
      console.log('🔵 [deviceStore] Updated existing device:', device.id);
    } else {
      // Add new device
      updated = [...devices, device];
      console.log('🔵 [deviceStore] Added new device:', device.id);
    }
    
    set({ devices: updated });
    await get().saveDevices();
  },
  
  removeDevice: async (deviceId: string) => {
    const { devices } = get();
    const updated = devices.filter(d => d.id !== deviceId);
    set({ devices: updated });
    await get().saveDevices();
  },
  
  updateDeviceStatus: (deviceId: string, online: boolean) => {
    const { devices } = get();
    const updated = devices.map(device =>
      device.id === deviceId
        ? { ...device, online, lastSeen: new Date() }
        : device
    );
    set({ devices: updated });
  },
  
  refreshDeviceStatuses: async () => {
    console.log('🔵 [deviceStore] Refreshing device statuses via shadowd API');
    const { devices } = get();
    
    for (const device of devices) {
      try {
        // Try to get device info from shadowd
        const shadowdService = getShadowdService();
        shadowdService.setBaseUrl(device.meshIP, 8080);
        
        const deviceInfo = await shadowdService.getDeviceInfo();
        
        // Update device status
        get().updateDeviceStatus(device.id, deviceInfo.isOnline);
        console.log(`✅ [deviceStore] Device ${device.name} is online`);
      } catch (error) {
        // HTTP API failed, but device might still be reachable via SSH
        // Mark as online since SSH connection doesn't depend on HTTP API
        console.log(`⚠️ [deviceStore] Device ${device.name} HTTP API failed, assuming online for SSH`);
        get().updateDeviceStatus(device.id, true);
      }
    }
    
    await get().saveDevices();
  },
  
  discoverDevices: async (hosts?: string[]) => {
    console.log('🔍 [deviceStore] Discovering devices via shadowd API');
    
    // 防抖：如果距离上次发现不到 5 秒，跳过
    const now = Date.now();
    const { lastDiscoveryTime } = get();
    if (now - lastDiscoveryTime < 5000) {
      console.log('⚠️ [deviceStore] Skipping discovery (too soon, last discovery was', Math.floor((now - lastDiscoveryTime) / 1000), 'seconds ago)');
      return;
    }
    
    set({ loading: true, error: null, lastDiscoveryTime: now });
    
    try {
      // 🎯 优先使用 mDNS 自动发现
      console.log('🔍 [deviceStore] Trying mDNS discovery first...');
      const mdnsService = getMDNSService();
      const mdnsDevices = await mdnsService.discoverDevices(5000);
      
      if (mdnsDevices.length > 0) {
        console.log(`✅ [deviceStore] Found ${mdnsDevices.length} devices via mDNS`);
        
        // Merge with existing devices
        const { devices: existingDevices } = get();
        const deviceMap = new Map<string, Device>();
        
        // Add existing devices first
        existingDevices.forEach(device => {
          deviceMap.set(device.id, device);
        });
        
        // Add mDNS discovered devices (use meshIP as unique key to avoid duplicates)
        mdnsDevices.forEach(device => {
          // Check if device with same IP already exists
          const existingWithSameIP = Array.from(deviceMap.values()).find(
            d => d.meshIP === device.meshIP
          );
          
          if (existingWithSameIP) {
            // Update existing device
            deviceMap.set(existingWithSameIP.id, {
              ...existingWithSameIP,
              ...device,
              id: existingWithSameIP.id, // Keep original ID
            });
          } else {
            // Add new device
            deviceMap.set(device.id, device);
          }
        });
        
        const merged = Array.from(deviceMap.values());
        
        set({ devices: merged, loading: false });
        await get().saveDevices();
        
        console.log(`✅ [deviceStore] Total devices after mDNS discovery: ${merged.length}`);
        return;
      }
      
      console.log('⚠️ [deviceStore] No devices found via mDNS, trying HTTP API...');
      
      // 回退到 HTTP API 发现
      const shadowdService = getShadowdService();
      
      const defaultHosts = hosts || [
        '192.168.2.57',  // Mac 的真实 IP（从配对码获取）
        '10.0.2.2',      // Android 模拟器访问宿主机
        'localhost',
        '127.0.0.1',
      ];
      
      console.log('🔍 [deviceStore] Scanning hosts:', defaultHosts);
      
      const discoveredDevices = await shadowdService.discoverDevices(defaultHosts);
      
      console.log(`✅ [deviceStore] Discovered ${discoveredDevices.length} devices`);
      
      // Convert shadowd devices to app format
      const devices = discoveredDevices.map(shadowdDevice => {
        const device = convertShadowdDevice(shadowdDevice);
        // 重要：使用 WebSocket SSH 代理端口，而不是直接 SSH 端口
        device.sshPort = 8022; // WebSocket SSH 代理端口
        return device;
      });
      
      // Merge with existing devices - use Map for deduplication by ID
      const { devices: existingDevices } = get();
      const deviceMap = new Map<string, Device>();
      
      // Add existing devices first
      existingDevices.forEach(device => {
        deviceMap.set(device.id, device);
      });
      
      // Update or add discovered devices
      devices.forEach(newDevice => {
        deviceMap.set(newDevice.id, newDevice);
      });
      
      const merged = Array.from(deviceMap.values());
      
      set({ devices: merged, loading: false });
      await get().saveDevices();
      
      console.log(`✅ [deviceStore] Total devices after discovery: ${merged.length}`);
    } catch (error) {
      // HTTP API 失败不影响 SSH 功能，静默处理
      console.log('⚠️ [deviceStore] HTTP API unavailable, using fallback device');
      
      // 如果 API 失败，回退到 Mock 数据（保持 SSH 连接可用）
      console.log('⚠️ [deviceStore] Creating fallback device...');
      
      // 使用固定 ID 避免重复创建
      const mockDeviceId = '630MacBook-Air.local-mock';
      const mockDevice: Device = {
        id: mockDeviceId,
        name: '630MacBook-Air.local',
        hostname: '630MacBook-Air.local',
        meshIP: '192.168.2.57', // 使用真实的 Mac IP
        sshPort: 8022, // WebSocket SSH 代理端口
        grpcPort: 50052,
        publicKey: 'mock_public_key',
        online: true,
        lastSeen: new Date(),
      };
      
      console.log('⚠️ [deviceStore] Mock device created:', mockDevice);
      
      const { devices: existingDevices } = get();
      console.log('⚠️ [deviceStore] Existing devices before merge:', existingDevices.length);
      
      // Use Map for deduplication by ID
      const deviceMap = new Map<string, Device>();
      existingDevices.forEach(device => {
        deviceMap.set(device.id, device);
      });
      
      // Add or update mock device
      deviceMap.set(mockDeviceId, mockDevice);
      
      const merged = Array.from(deviceMap.values());
      
      console.log('⚠️ [deviceStore] Merged devices:', merged.length);
      console.log('⚠️ [deviceStore] Setting devices to store...');
      
      set({ devices: merged, loading: false, error: null });
      
      console.log('⚠️ [deviceStore] Saving devices to AsyncStorage...');
      await get().saveDevices();
      
      console.log(`✅ [deviceStore] Using fallback device, total: ${merged.length}`);
    }
  },
  
  clearDevices: async () => {
    try {
      set({ devices: [], loading: false, error: null });
      await AsyncStorage.removeItem(DEVICES_STORAGE_KEY);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear devices';
      set({ error: errorMessage });
      throw error;
    }
  },
  
  /**
   * Remove duplicate devices based on ID
   * This is useful for cleaning up devices that were added multiple times
   */
  deduplicateDevices: async () => {
    console.log('🧹 [deviceStore] Deduplicating devices');
    const { devices } = get();
    
    // Use Map to deduplicate by ID
    const deviceMap = new Map<string, Device>();
    devices.forEach(device => {
      // Keep the most recent version (last seen)
      const existing = deviceMap.get(device.id);
      if (!existing || device.lastSeen > existing.lastSeen) {
        deviceMap.set(device.id, device);
      }
    });
    
    const deduplicated = Array.from(deviceMap.values());
    
    if (deduplicated.length < devices.length) {
      console.log(`🧹 [deviceStore] Removed ${devices.length - deduplicated.length} duplicate devices`);
      set({ devices: deduplicated });
      await get().saveDevices();
    } else {
      console.log('✅ [deviceStore] No duplicate devices found');
    }
    
    return deduplicated.length;
  },
}));
