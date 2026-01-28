/**
 * Device List State Management
 */

import { create } from 'zustand';
import { Device } from '../types/device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICES_STORAGE_KEY = '@shadow_shuttle_devices';

interface DeviceState {
  devices: Device[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadDevices: () => Promise<void>;
  saveDevices: () => Promise<void>;
  addDevice: (device: Device) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  updateDeviceStatus: (deviceId: string, online: boolean) => void;
  refreshDeviceStatuses: () => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  loading: false,
  error: null,
  
  loadDevices: async () => {
    set({ loading: true, error: null });
    try {
      const stored = await AsyncStorage.getItem(DEVICES_STORAGE_KEY);
      if (stored) {
        const devices = JSON.parse(stored);
        // Convert date strings back to Date objects
        devices.forEach((device: Device) => {
          device.lastSeen = new Date(device.lastSeen);
        });
        set({ devices, loading: false });
      } else {
        set({ devices: [], loading: false });
      }
    } catch (error) {
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
    const updated = [...devices, device];
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
    // TODO: Implement actual health check via gRPC
    // This is a placeholder implementation
    const { devices } = get();
    
    for (const device of devices) {
      try {
        // Simulate health check
        const online = Math.random() > 0.3; // 70% online rate for demo
        get().updateDeviceStatus(device.id, online);
      } catch (error) {
        get().updateDeviceStatus(device.id, false);
      }
    }
    
    await get().saveDevices();
  },
}));
