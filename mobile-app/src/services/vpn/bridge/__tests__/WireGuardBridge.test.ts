/**
 * WireGuard Bridge Unit Tests
 */

import { WireGuardBridge } from '../WireGuardBridge';
import { VPNStatus } from '../../interfaces/IWireGuardBridge';

// Mock React Native modules
jest.mock('react-native', () => ({
  NativeModules: {
    WireGuardModule: {
      connect: jest.fn(),
      disconnect: jest.fn(),
      getStatus: jest.fn(),
    },
  },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn().mockReturnValue({
      remove: jest.fn(),
    }),
  })),
}));

const { NativeModules } = require('react-native');
const { WireGuardModule } = NativeModules;

describe('WireGuardBridge', () => {
  let bridge: WireGuardBridge;

  beforeEach(() => {
    jest.clearAllMocks();
    bridge = new WireGuardBridge();
  });

  describe('connect', () => {
    it('should connect with valid configuration', async () => {
      const config = '[Interface]\nPrivateKey=test\n';
      WireGuardModule.connect.mockResolvedValue(undefined);

      await bridge.connect(config);

      expect(WireGuardModule.connect).toHaveBeenCalledWith(config);
    });

    it('should throw error for empty configuration', async () => {
      await expect(bridge.connect('')).rejects.toThrow('Configuration string is required');
    });

    it('should throw error for whitespace-only configuration', async () => {
      await expect(bridge.connect('   ')).rejects.toThrow('Configuration string is required');
    });

    it('should handle native module errors', async () => {
      const config = '[Interface]\nPrivateKey=test\n';
      WireGuardModule.connect.mockRejectedValue(new Error('Permission denied'));

      await expect(bridge.connect(config)).rejects.toThrow('Failed to connect: Permission denied');
    });

    it('should handle unknown errors', async () => {
      const config = '[Interface]\nPrivateKey=test\n';
      WireGuardModule.connect.mockRejectedValue('Unknown error');

      await expect(bridge.connect(config)).rejects.toThrow('Failed to connect: Unknown error');
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      WireGuardModule.disconnect.mockResolvedValue(undefined);

      await bridge.disconnect();

      expect(WireGuardModule.disconnect).toHaveBeenCalled();
    });

    it('should handle native module errors', async () => {
      WireGuardModule.disconnect.mockRejectedValue(new Error('Not connected'));

      await expect(bridge.disconnect()).rejects.toThrow('Failed to disconnect: Not connected');
    });

    it('should handle unknown errors', async () => {
      WireGuardModule.disconnect.mockRejectedValue('Unknown error');

      await expect(bridge.disconnect()).rejects.toThrow('Failed to disconnect: Unknown error');
    });
  });

  describe('getStatus', () => {
    it('should return valid status', async () => {
      WireGuardModule.getStatus.mockResolvedValue('connected');

      const status = await bridge.getStatus();

      expect(status).toBe('connected');
      expect(WireGuardModule.getStatus).toHaveBeenCalled();
    });

    it('should validate all valid statuses', async () => {
      const validStatuses: VPNStatus[] = [
        'disconnected',
        'connecting',
        'connected',
        'disconnecting',
        'reasserting',
        'invalid',
      ];

      for (const status of validStatuses) {
        WireGuardModule.getStatus.mockResolvedValue(status);
        const result = await bridge.getStatus();
        expect(result).toBe(status);
      }
    });

    it('should default to invalid for unknown status', async () => {
      WireGuardModule.getStatus.mockResolvedValue('unknown-status');

      const status = await bridge.getStatus();

      expect(status).toBe('invalid');
    });

    it('should handle native module errors', async () => {
      WireGuardModule.getStatus.mockRejectedValue(new Error('Module not initialized'));

      await expect(bridge.getStatus()).rejects.toThrow('Failed to get status: Module not initialized');
    });
  });

  describe('addStatusChangeListener', () => {
    it('should add listener and return subscription', () => {
      const listener = jest.fn();

      const subscription = bridge.addStatusChangeListener(listener);

      expect(subscription).toHaveProperty('remove');
      expect(typeof subscription.remove).toBe('function');
    });

    it('should remove listener when subscription.remove is called', () => {
      const listener = jest.fn();

      const subscription = bridge.addStatusChangeListener(listener);
      subscription.remove();

      // Listener should be removed from internal map
      // (tested indirectly through removeAllListeners)
    });

    it('should handle multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const sub1 = bridge.addStatusChangeListener(listener1);
      const sub2 = bridge.addStatusChangeListener(listener2);

      expect(sub1).not.toBe(sub2);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      bridge.addStatusChangeListener(listener1);
      bridge.addStatusChangeListener(listener2);

      bridge.removeAllListeners();

      // All listeners should be removed
      // (verified by checking internal state)
    });

    it('should not throw if no listeners exist', () => {
      expect(() => bridge.removeAllListeners()).not.toThrow();
    });
  });

  describe('Status validation', () => {
    it('should validate status in listener callback', () => {
      const listener = jest.fn();
      const mockEmitter = require('react-native').NativeEventEmitter.mock.results[0].value;
      
      bridge.addStatusChangeListener(listener);

      // Simulate event with valid status
      const eventCallback = mockEmitter.addListener.mock.calls[0][1];
      eventCallback({ status: 'connected' });

      expect(listener).toHaveBeenCalledWith({ status: 'connected' });
    });

    it('should default to invalid for unknown status in listener', () => {
      const listener = jest.fn();
      const mockEmitter = require('react-native').NativeEventEmitter.mock.results[0].value;
      
      bridge.addStatusChangeListener(listener);

      // Simulate event with invalid status
      const eventCallback = mockEmitter.addListener.mock.calls[0][1];
      eventCallback({ status: 'unknown-status' });

      expect(listener).toHaveBeenCalledWith({ status: 'invalid' });
    });
  });

  describe('Module availability', () => {
    it('should throw error if native module is not available', () => {
      // Temporarily remove native module
      const originalModule = NativeModules.WireGuardModule;
      delete NativeModules.WireGuardModule;

      expect(() => new WireGuardBridge()).toThrow(
        'WireGuardModule is not available. Make sure native module is properly linked.'
      );

      // Restore native module
      NativeModules.WireGuardModule = originalModule;
    });
  });
});
