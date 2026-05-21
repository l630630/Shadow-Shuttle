/**
 * Network Monitor Implementation
 * 
 * Monitors network connectivity using @react-native-community/netinfo
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { INetworkMonitor, NetworkState, NetworkType, NetworkChangeCallback } from '../interfaces/INetworkMonitor';

export class NetworkMonitor implements INetworkMonitor {
  private subscription: NetInfoSubscription | null = null;
  private callback: NetworkChangeCallback | null = null;

  startMonitoring(callback: NetworkChangeCallback): void {
    if (this.subscription) {
      console.warn('Network monitoring already started');
      return;
    }

    this.callback = callback;

    // Subscribe to network state changes
    this.subscription = NetInfo.addEventListener((state) => {
      const networkState = this.convertNetInfoState(state);
      this.callback?.(networkState);
    });
  }

  stopMonitoring(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.callback = null;
  }

  async getCurrentState(): Promise<NetworkState> {
    const state = await NetInfo.fetch();
    return this.convertNetInfoState(state);
  }

  async isConnected(): Promise<boolean> {
    const state = await this.getCurrentState();
    return state.isConnected;
  }

  // MARK: - Private Methods

  private convertNetInfoState(state: NetInfoState): NetworkState {
    return {
      isConnected: state.isConnected ?? false,
      type: this.convertNetworkType(state.type),
    };
  }

  private convertNetworkType(type: string): NetworkType {
    switch (type) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'cellular';
      case 'ethernet':
        return 'ethernet';
      case 'none':
        return 'none';
      default:
        return 'unknown';
    }
  }
}
