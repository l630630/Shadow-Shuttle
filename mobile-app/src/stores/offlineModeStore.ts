/**
 * Offline Mode Store
 * 离线模式存储
 * 
 * Manages offline/online state using Zustand.
 * Provides automatic network detection and manual mode switching.
 * 
 * 使用 Zustand 管理离线/在线状态。
 * 提供自动网络检测和手动模式切换。
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */

import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Offline Mode State
 * 离线模式状态
 */
interface OfflineModeState {
  // State
  isOffline: boolean;
  isManualMode: boolean; // User manually set offline mode
  networkAvailable: boolean;
  lastOnlineTime: Date | null;
  
  // Actions
  setOffline: (offline: boolean, manual?: boolean) => void;
  toggleOfflineMode: () => void;
  checkNetworkStatus: () => Promise<void>;
  initialize: () => void;
  cleanup: () => void;
}

/**
 * Network state listener unsubscribe function
 */
let unsubscribeNetInfo: (() => void) | null = null;

/**
 * Offline Mode Store
 * 离线模式存储
 * 
 * Manages offline/online state with automatic network detection.
 * 管理离线/在线状态，具有自动网络检测功能。
 */
export const useOfflineModeStore = create<OfflineModeState>((set, get) => ({
  // Initial state
  isOffline: false,
  isManualMode: false,
  networkAvailable: true,
  lastOnlineTime: null,

  /**
   * Set offline mode
   * 设置离线模式
   * 
   * Requirements: 9.1, 9.5, 9.7
   * 
   * @param offline Whether to enable offline mode
   * @param manual Whether this is a manual change
   */
  setOffline: (offline: boolean, manual: boolean = false) => {
    const currentState = get();
    
    // If going offline, record last online time
    const lastOnlineTime = offline && !currentState.isOffline
      ? new Date()
      : currentState.lastOnlineTime;

    set({
      isOffline: offline,
      isManualMode: manual,
      lastOnlineTime,
    });

    console.log(
      `Offline mode ${offline ? 'enabled' : 'disabled'}${manual ? ' (manual)' : ' (auto)'}`
    );

    // Requirement 9.6: Display offline mode indicator
    if (offline) {
      console.log('⚠️ Offline mode active - Natural language parsing disabled');
    } else {
      console.log('✓ Online mode active - All features available');
    }
  },

  /**
   * Toggle offline mode manually
   * 手动切换离线模式
   * 
   * Requirement 9.7: Allow manual offline mode toggle
   */
  toggleOfflineMode: () => {
    const { isOffline, isManualMode } = get();
    
    // If currently in manual mode, toggle it
    // If in auto mode, switch to manual offline
    const newOffline = isManualMode ? !isOffline : true;
    
    set({
      isOffline: newOffline,
      isManualMode: true,
    });

    console.log(`Manually ${newOffline ? 'enabled' : 'disabled'} offline mode`);
  },

  /**
   * Check current network status
   * 检查当前网络状态
   * 
   * Requirement 9.1: Automatic offline mode when AI service unavailable
   */
  checkNetworkStatus: async () => {
    try {
      const state = await NetInfo.fetch();
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? false;
      
      const networkAvailable = isConnected && isInternetReachable;
      
      set({ networkAvailable });

      // Requirement 9.1: Auto switch to offline when network unavailable
      // Only auto-switch if not in manual mode
      const { isManualMode } = get();
      if (!isManualMode) {
        if (!networkAvailable) {
          get().setOffline(true, false);
        } else {
          // Requirement 9.5: Auto switch back to online when network restored
          get().setOffline(false, false);
        }
      }

      console.log(`Network status: ${networkAvailable ? 'available' : 'unavailable'}`);
    } catch (error) {
      console.error('Error checking network status:', error);
    }
  },

  /**
   * Initialize offline mode store
   * 初始化离线模式存储
   * 
   * Sets up network state listener for automatic mode switching.
   * 设置网络状态监听器以实现自动模式切换。
   * 
   * Requirements: 9.1, 9.5
   */
  initialize: () => {
    console.log('Initializing offline mode store...');

    // Check initial network status
    get().checkNetworkStatus();

    // Subscribe to network state changes
    unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? false;
      const networkAvailable = isConnected && isInternetReachable;

      console.log('Network state changed:', {
        isConnected,
        isInternetReachable,
        networkAvailable,
      });

      set({ networkAvailable });

      // Auto-switch offline mode if not in manual mode
      const { isManualMode } = get();
      if (!isManualMode) {
        if (!networkAvailable) {
          // Requirement 9.1: Auto switch to offline
          get().setOffline(true, false);
        } else {
          // Requirement 9.5: Auto switch back to online
          get().setOffline(false, false);
        }
      }
    });

    console.log('Offline mode store initialized');
  },

  /**
   * Cleanup offline mode store
   * 清理离线模式存储
   * 
   * Removes network state listener.
   * 移除网络状态监听器。
   */
  cleanup: () => {
    if (unsubscribeNetInfo) {
      unsubscribeNetInfo();
      unsubscribeNetInfo = null;
      console.log('Offline mode store cleaned up');
    }
  },
}));

/**
 * Hook to check if a feature is available in current mode
 * 检查功能在当前模式下是否可用的 Hook
 * 
 * Requirements: 9.2, 9.3, 9.4
 */
export function useFeatureAvailability() {
  const isOffline = useOfflineModeStore((state) => state.isOffline);

  return {
    // Requirement 9.2: Disable natural language parsing when offline
    canUseNaturalLanguage: !isOffline,
    
    // Requirement 9.3: History and favorites available offline
    canUseHistory: true,
    canUseFavorites: true,
    
    // Requirement 9.4: Direct command input available offline
    canUseDirectCommand: true,
    
    // AI features require online mode
    canUseAI: !isOffline,
    canUseVoiceInput: !isOffline,
  };
}

/**
 * Get offline mode status message
 * 获取离线模式状态消息
 * 
 * Requirement 9.6: Display offline mode indicator
 */
export function getOfflineModeMessage(isOffline: boolean): string {
  if (isOffline) {
    return '离线模式 - 自然语言解析不可用';
  }
  return '在线模式 - 所有功能可用';
}

/**
 * Initialize offline mode on app start
 * 应用启动时初始化离线模式
 */
export function initializeOfflineMode() {
  useOfflineModeStore.getState().initialize();
}

/**
 * Cleanup offline mode on app exit
 * 应用退出时清理离线模式
 */
export function cleanupOfflineMode() {
  useOfflineModeStore.getState().cleanup();
}

export default useOfflineModeStore;
