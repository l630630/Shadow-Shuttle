/**
 * VPN Store (Zustand)
 * 
 * Global state management for VPN functionality
 */

import { create } from 'zustand';
import { container } from '../core/DIContainer';
import { IVPNService } from '../services/vpn/interfaces/IVPNService';
import { VPNStatus } from '../services/vpn/interfaces/IWireGuardBridge';
import { ConnectionInfo } from '../services/vpn/interfaces/IConnectionManager';

interface VPNState {
  // State
  status: VPNStatus;
  isConnected: boolean;
  isConfigured: boolean;
  isAutoReconnectEnabled: boolean;
  connectionInfo: ConnectionInfo | null;
  error: string | null;
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  register: (config: { headscaleUrl: string; deviceName: string; preAuthKey: string }) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  updateStatus: () => Promise<void>;
  setAutoReconnect: (enabled: boolean) => void;
  clearConfiguration: () => Promise<void>;
  clearError: () => void;
}

export const useVPNStore = create<VPNState>((set, get) => {
  let vpnService: IVPNService | null = null;
  let statusSubscription: { remove: () => void } | null = null;

  // Get VPN service instance
  const getVPNService = (): IVPNService => {
    if (!vpnService) {
      vpnService = container.resolve<IVPNService>('IVPNService');
    }
    return vpnService;
  };

  // Setup status listener
  const setupStatusListener = () => {
    if (statusSubscription) {
      return; // Already listening
    }

    const service = getVPNService();
    statusSubscription = service.addStatusChangeListener((event) => {
      set({
        status: event.status,
        isConnected: event.status === 'connected',
        connectionInfo: service.getConnectionInfo(),
      });
    });
  };

  return {
    // Initial state
    status: 'disconnected',
    isConnected: false,
    isConfigured: false,
    isAutoReconnectEnabled: false,
    connectionInfo: null,
    error: null,
    isLoading: false,

    // Initialize store
    initialize: async () => {
      try {
        set({ isLoading: true, error: null });

        const service = getVPNService();

        // Check if configured
        const isConfigured = await service.isConfigured();

        // Get current status
        const status = await service.getStatus();
        const isConnected = service.isConnected();
        const connectionInfo = service.getConnectionInfo();
        const isAutoReconnectEnabled = service.isAutoReconnectEnabled();

        // Setup status listener
        setupStatusListener();

        set({
          isConfigured,
          status,
          isConnected,
          connectionInfo,
          isAutoReconnectEnabled,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to initialize VPN store:', error);
        set({
          error: error instanceof Error ? error.message : 'Initialization failed',
          isLoading: false,
        });
      }
    },

    // Register device
    register: async (config) => {
      try {
        set({ isLoading: true, error: null });

        const service = getVPNService();
        const result = await service.register(config);

        // Update state
        set({
          isConfigured: true,
          connectionInfo: {
            status: 'disconnected',
            meshIP: result.meshIP,
          },
          isLoading: false,
        });

        console.log('Device registered successfully:', result);
      } catch (error) {
        console.error('Registration failed:', error);
        set({
          error: error instanceof Error ? error.message : 'Registration failed',
          isLoading: false,
        });
        throw error;
      }
    },

    // Connect to VPN
    connect: async () => {
      try {
        set({ isLoading: true, error: null });

        const service = getVPNService();
        await service.connect();

        // Status will be updated via listener
        set({ isLoading: false });
      } catch (error) {
        console.error('Connection failed:', error);
        set({
          error: error instanceof Error ? error.message : 'Connection failed',
          isLoading: false,
        });
        throw error;
      }
    },

    // Disconnect from VPN
    disconnect: async () => {
      try {
        set({ isLoading: true, error: null });

        const service = getVPNService();
        await service.disconnect();

        // Status will be updated via listener
        set({ isLoading: false });
      } catch (error) {
        console.error('Disconnection failed:', error);
        set({
          error: error instanceof Error ? error.message : 'Disconnection failed',
          isLoading: false,
        });
        throw error;
      }
    },

    // Update status manually
    updateStatus: async () => {
      try {
        const service = getVPNService();
        const status = await service.getStatus();
        const isConnected = service.isConnected();
        const connectionInfo = service.getConnectionInfo();

        set({ status, isConnected, connectionInfo });
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    },

    // Set auto-reconnect
    setAutoReconnect: (enabled) => {
      try {
        const service = getVPNService();

        if (enabled) {
          service.enableAutoReconnect({
            reconnectOnNetworkChange: true,
            reconnectOnAppResume: true,
            maxRetries: 3,
          });
        } else {
          service.disableAutoReconnect();
        }

        set({ isAutoReconnectEnabled: enabled });
      } catch (error) {
        console.error('Failed to set auto-reconnect:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to set auto-reconnect',
        });
      }
    },

    // Clear configuration
    clearConfiguration: async () => {
      try {
        set({ isLoading: true, error: null });

        const service = getVPNService();
        await service.clearConfiguration();

        set({
          isConfigured: false,
          status: 'disconnected',
          isConnected: false,
          connectionInfo: null,
          isAutoReconnectEnabled: false,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to clear configuration:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to clear configuration',
          isLoading: false,
        });
        throw error;
      }
    },

    // Clear error
    clearError: () => {
      set({ error: null });
    },
  };
});
