/**
 * WireGuard Bridge Implementation
 * 
 * Type-safe wrapper around native WireGuard module
 */

import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';
import { IWireGuardBridge, VPNStatus, VPNStatusChangeListener } from '../interfaces/IWireGuardBridge';

const { WireGuardModule } = NativeModules;

export class WireGuardBridge implements IWireGuardBridge {
  private eventEmitter: NativeEventEmitter;
  private listeners: Map<VPNStatusChangeListener, EmitterSubscription>;

  constructor() {
    if (!WireGuardModule) {
      throw new Error('WireGuardModule is not available. Make sure native module is properly linked.');
    }

    this.eventEmitter = new NativeEventEmitter(WireGuardModule);
    this.listeners = new Map();
  }

  async connect(configString: string): Promise<void> {
    if (!configString || configString.trim().length === 0) {
      throw new Error('Configuration string is required');
    }

    try {
      await WireGuardModule.connect(configString);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect: ${error.message}`);
      }
      throw new Error('Failed to connect: Unknown error');
    }
  }

  async disconnect(): Promise<void> {
    try {
      await WireGuardModule.disconnect();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to disconnect: ${error.message}`);
      }
      throw new Error('Failed to disconnect: Unknown error');
    }
  }

  async getStatus(): Promise<VPNStatus> {
    try {
      const status = await WireGuardModule.getStatus();
      return this.validateStatus(status);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get status: ${error.message}`);
      }
      throw new Error('Failed to get status: Unknown error');
    }
  }

  addStatusChangeListener(listener: VPNStatusChangeListener): { remove: () => void } {
    const subscription = this.eventEmitter.addListener('onStatusChange', (event) => {
      const validatedStatus = this.validateStatus(event.status);
      listener({ status: validatedStatus });
    });

    this.listeners.set(listener, subscription);

    return {
      remove: () => {
        const sub = this.listeners.get(listener);
        if (sub) {
          sub.remove();
          this.listeners.delete(listener);
        }
      },
    };
  }

  removeAllListeners(): void {
    this.listeners.forEach((subscription) => {
      subscription.remove();
    });
    this.listeners.clear();
  }

  // MARK: - Private Methods

  private validateStatus(status: string): VPNStatus {
    const validStatuses: VPNStatus[] = [
      'disconnected',
      'connecting',
      'connected',
      'disconnecting',
      'reasserting',
      'invalid',
    ];

    if (validStatuses.includes(status as VPNStatus)) {
      return status as VPNStatus;
    }

    console.warn(`Invalid VPN status received: ${status}, defaulting to 'invalid'`);
    return 'invalid';
  }
}
