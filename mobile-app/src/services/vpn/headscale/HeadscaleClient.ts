/**
 * Headscale Client Implementation
 * 
 * Communicates with Headscale server for device registration
 * and WireGuard configuration retrieval
 */

import { IHeadscaleClient, HeadscaleRegisterParams, HeadscaleRegisterResult } from '../interfaces/IHeadscaleClient';
import { IHttpClient } from '../interfaces/IHttpClient';
import { IConfigParser } from '../interfaces/IConfigParser';
import { WireGuardConfig } from '../types/WireGuardConfig';
import { HeadscaleRegisterResponse, HeadscaleConfigResponse } from '../types/WireGuardConfig';

export class HeadscaleClient implements IHeadscaleClient {
  private readonly REGISTER_ENDPOINT = '/api/v1/device/register';
  private readonly CONFIG_ENDPOINT = '/api/v1/device/config';
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_RETRIES = 3;

  constructor(
    private httpClient: IHttpClient,
    private configParser: IConfigParser
  ) {}

  async registerDevice(params: HeadscaleRegisterParams): Promise<HeadscaleRegisterResult> {
    const { baseUrl, deviceName, preAuthKey } = params;

    // Validate parameters
    this.validateUrl(baseUrl);
    if (!deviceName || deviceName.trim().length === 0) {
      throw new Error('Device name is required');
    }
    if (!preAuthKey || preAuthKey.trim().length === 0) {
      throw new Error('Pre-auth key is required');
    }

    const url = this.buildUrl(baseUrl, this.REGISTER_ENDPOINT);

    try {
      const response = await this.httpClient.post<HeadscaleRegisterResponse>(
        url,
        {
          deviceName: deviceName.trim(),
          preAuthKey: preAuthKey.trim(),
        },
        {
          timeout: this.REQUEST_TIMEOUT,
          maxRetries: this.MAX_RETRIES,
        }
      );

      if (!response.nodeId || !response.meshIP) {
        throw new Error('Invalid registration response: missing nodeId or meshIP');
      }

      return {
        nodeId: response.nodeId,
        nodeName: response.nodeName || deviceName,
        meshIP: response.meshIP,
      };
    } catch (error) {
      if (error instanceof Error) {
        // Enhance error message for common issues
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Authentication failed: Invalid pre-auth key');
        }
        if (error.message.includes('404')) {
          throw new Error('Headscale server not found: Check URL');
        }
        if (error.message.includes('timeout')) {
          throw new Error('Registration timeout: Server not responding');
        }
        throw new Error(`Registration failed: ${error.message}`);
      }
      throw new Error('Registration failed: Unknown error');
    }
  }

  async getWireGuardConfig(baseUrl: string, nodeId: string): Promise<WireGuardConfig> {
    this.validateUrl(baseUrl);
    if (!nodeId || nodeId.trim().length === 0) {
      throw new Error('Node ID is required');
    }

    const url = this.buildUrl(baseUrl, `${this.CONFIG_ENDPOINT}/${nodeId}`);

    try {
      const response = await this.httpClient.get<HeadscaleConfigResponse>(
        url,
        {
          timeout: this.REQUEST_TIMEOUT,
          maxRetries: this.MAX_RETRIES,
        }
      );

      if (!response.config) {
        throw new Error('Invalid config response: missing config data');
      }

      // Parse WireGuard INI format to config object
      const config = this.configParser.parse(response.config);

      return config;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          throw new Error('Device not found: Invalid node ID');
        }
        if (error.message.includes('timeout')) {
          throw new Error('Config retrieval timeout: Server not responding');
        }
        throw new Error(`Failed to get config: ${error.message}`);
      }
      throw new Error('Failed to get config: Unknown error');
    }
  }

  private validateUrl(url: string): void {
    if (!url || url.trim().length === 0) {
      throw new Error('URL is required');
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('URL must use http or https protocol');
      }
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  private buildUrl(baseUrl: string, endpoint: string): string {
    // Remove trailing slash from baseUrl
    const base = baseUrl.replace(/\/$/, '');
    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }
}
