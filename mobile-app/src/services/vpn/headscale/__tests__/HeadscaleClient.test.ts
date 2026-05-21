/**
 * Headscale Client Unit Tests
 */

import { HeadscaleClient } from '../HeadscaleClient';
import { IHttpClient, HttpRequestOptions } from '../../interfaces/IHttpClient';
import { IConfigParser } from '../../interfaces/IConfigParser';
import { WireGuardConfig } from '../../types/WireGuardConfig';

// Mock implementations
class MockHttpClient implements IHttpClient {
  private mockGetResponse: any = null;
  private mockPostResponse: any = null;
  private shouldFail = false;
  private failureError: Error | null = null;

  async get<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    if (this.shouldFail && this.failureError) {
      throw this.failureError;
    }
    return this.mockGetResponse as T;
  }

  async post<T>(url: string, data: any, options?: HttpRequestOptions): Promise<T> {
    if (this.shouldFail && this.failureError) {
      throw this.failureError;
    }
    return this.mockPostResponse as T;
  }

  // Test helpers
  setGetResponse(response: any) {
    this.mockGetResponse = response;
  }

  setPostResponse(response: any) {
    this.mockPostResponse = response;
  }

  setFailure(error: Error) {
    this.shouldFail = true;
    this.failureError = error;
  }

  reset() {
    this.mockGetResponse = null;
    this.mockPostResponse = null;
    this.shouldFail = false;
    this.failureError = null;
  }
}

class MockConfigParser implements IConfigParser {
  private mockConfig: WireGuardConfig | null = null;

  parse(configStr: string): WireGuardConfig {
    if (this.mockConfig) {
      return this.mockConfig;
    }
    throw new Error('No mock config set');
  }

  format(config: WireGuardConfig): string {
    return '';
  }

  // Test helper
  setMockConfig(config: WireGuardConfig) {
    this.mockConfig = config;
  }
}

describe('HeadscaleClient', () => {
  let httpClient: MockHttpClient;
  let configParser: MockConfigParser;
  let client: HeadscaleClient;

  const validParams = {
    baseUrl: 'https://headscale.example.com',
    deviceName: 'test-device',
    preAuthKey: 'test-key-123',
  };

  const mockRegisterResponse = {
    nodeId: 'node-123',
    nodeName: 'test-device',
    meshIP: '100.64.0.2',
  };

  const mockConfig: WireGuardConfig = {
    interface: {
      privateKey: 'cHJpdmF0ZS1rZXk=',
      address: '100.64.0.2/32',
      dns: '1.1.1.1',
    },
    peers: [
      {
        publicKey: 'cHVibGljLWtleQ==',
        endpoint: 'vpn.example.com:51820',
        allowedIPs: '100.64.0.0/10',
        persistentKeepalive: 25,
      },
    ],
  };

  beforeEach(() => {
    httpClient = new MockHttpClient();
    configParser = new MockConfigParser();
    client = new HeadscaleClient(httpClient, configParser);
  });

  describe('registerDevice', () => {
    it('should register device successfully', async () => {
      httpClient.setPostResponse(mockRegisterResponse);

      const result = await client.registerDevice(validParams);

      expect(result).toEqual({
        nodeId: 'node-123',
        nodeName: 'test-device',
        meshIP: '100.64.0.2',
      });
    });

    it('should throw error for invalid URL', async () => {
      await expect(
        client.registerDevice({ ...validParams, baseUrl: 'invalid-url' })
      ).rejects.toThrow('Invalid URL format');
    });

    it('should throw error for empty device name', async () => {
      await expect(
        client.registerDevice({ ...validParams, deviceName: '' })
      ).rejects.toThrow('Device name is required');
    });

    it('should throw error for empty pre-auth key', async () => {
      await expect(
        client.registerDevice({ ...validParams, preAuthKey: '' })
      ).rejects.toThrow('Pre-auth key is required');
    });

    it('should handle authentication error', async () => {
      httpClient.setFailure(new Error('401 Unauthorized'));

      await expect(client.registerDevice(validParams)).rejects.toThrow(
        'Authentication failed: Invalid pre-auth key'
      );
    });

    it('should handle server not found error', async () => {
      httpClient.setFailure(new Error('404 Not Found'));

      await expect(client.registerDevice(validParams)).rejects.toThrow(
        'Headscale server not found: Check URL'
      );
    });

    it('should handle timeout error', async () => {
      httpClient.setFailure(new Error('Request timeout'));

      await expect(client.registerDevice(validParams)).rejects.toThrow(
        'Registration timeout: Server not responding'
      );
    });

    it('should handle invalid response', async () => {
      httpClient.setPostResponse({ nodeId: 'node-123' }); // Missing meshIP

      await expect(client.registerDevice(validParams)).rejects.toThrow(
        'Invalid registration response: missing nodeId or meshIP'
      );
    });

    it('should trim whitespace from parameters', async () => {
      httpClient.setPostResponse(mockRegisterResponse);

      const result = await client.registerDevice({
        ...validParams,
        deviceName: '  test-device  ',
        preAuthKey: '  test-key-123  ',
      });

      expect(result.nodeId).toBe('node-123');
    });
  });

  describe('getWireGuardConfig', () => {
    it('should get config successfully', async () => {
      httpClient.setGetResponse({
        config: '[Interface]\nPrivateKey=test\n',
        meshIP: '100.64.0.2',
        nodeId: 'node-123',
      });
      configParser.setMockConfig(mockConfig);

      const result = await client.getWireGuardConfig(
        'https://headscale.example.com',
        'node-123'
      );

      expect(result).toEqual(mockConfig);
    });

    it('should throw error for invalid URL', async () => {
      await expect(
        client.getWireGuardConfig('invalid-url', 'node-123')
      ).rejects.toThrow('Invalid URL format');
    });

    it('should throw error for empty node ID', async () => {
      await expect(
        client.getWireGuardConfig('https://headscale.example.com', '')
      ).rejects.toThrow('Node ID is required');
    });

    it('should handle device not found error', async () => {
      httpClient.setFailure(new Error('404 Not Found'));

      await expect(
        client.getWireGuardConfig('https://headscale.example.com', 'node-123')
      ).rejects.toThrow('Device not found: Invalid node ID');
    });

    it('should handle timeout error', async () => {
      httpClient.setFailure(new Error('Request timeout'));

      await expect(
        client.getWireGuardConfig('https://headscale.example.com', 'node-123')
      ).rejects.toThrow('Config retrieval timeout: Server not responding');
    });

    it('should handle invalid response', async () => {
      httpClient.setGetResponse({ meshIP: '100.64.0.2' }); // Missing config

      await expect(
        client.getWireGuardConfig('https://headscale.example.com', 'node-123')
      ).rejects.toThrow('Invalid config response: missing config data');
    });
  });

  describe('Property: Registration idempotency', () => {
    it('should return consistent result for multiple registrations', async () => {
      httpClient.setPostResponse(mockRegisterResponse);

      const result1 = await client.registerDevice(validParams);
      const result2 = await client.registerDevice(validParams);
      const result3 = await client.registerDevice(validParams);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });

  describe('Property: Error message clarity', () => {
    it('should provide clear error messages for all failure scenarios', async () => {
      const scenarios = [
        { error: new Error('401'), expectedMessage: 'Authentication failed' },
        { error: new Error('404'), expectedMessage: 'Headscale server not found' },
        { error: new Error('timeout'), expectedMessage: 'Registration timeout' },
      ];

      for (const scenario of scenarios) {
        httpClient.reset();
        httpClient.setFailure(scenario.error);

        try {
          await client.registerDevice(validParams);
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain(scenario.expectedMessage);
          expect((error as Error).message.length).toBeGreaterThan(0);
        }
      }
    });

    it('should provide clear error messages for validation failures', async () => {
      const invalidCases = [
        { params: { ...validParams, baseUrl: '' }, expectedMessage: 'URL is required' },
        { params: { ...validParams, deviceName: '' }, expectedMessage: 'Device name is required' },
        { params: { ...validParams, preAuthKey: '' }, expectedMessage: 'Pre-auth key is required' },
      ];

      for (const testCase of invalidCases) {
        try {
          await client.registerDevice(testCase.params);
          fail('Should have thrown error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe(testCase.expectedMessage);
        }
      }
    });
  });

  describe('URL building', () => {
    it('should handle URLs with trailing slash', async () => {
      httpClient.setPostResponse(mockRegisterResponse);

      await client.registerDevice({
        ...validParams,
        baseUrl: 'https://headscale.example.com/',
      });

      // Should not throw
    });

    it('should handle URLs without trailing slash', async () => {
      httpClient.setPostResponse(mockRegisterResponse);

      await client.registerDevice({
        ...validParams,
        baseUrl: 'https://headscale.example.com',
      });

      // Should not throw
    });

    it('should reject non-http(s) protocols', async () => {
      await expect(
        client.registerDevice({
          ...validParams,
          baseUrl: 'ftp://headscale.example.com',
        })
      ).rejects.toThrow('URL must use http or https protocol');
    });
  });
});
