/**
 * Headscale Client Interface
 * 
 * Handles device registration and WireGuard configuration retrieval
 * from Headscale server
 */

import { WireGuardConfig } from '../types/WireGuardConfig';

export interface HeadscaleRegisterParams {
  baseUrl: string;
  deviceName: string;
  preAuthKey: string;
}

export interface HeadscaleRegisterResult {
  nodeId: string;
  nodeName: string;
  meshIP: string;
}

export interface IHeadscaleClient {
  /**
   * Register device with Headscale server
   * @param params - Registration parameters
   * @returns Registration result with node info
   * @throws {NetworkError} If network request fails
   * @throws {AuthError} If authentication fails
   * @throws {Error} If registration fails
   */
  registerDevice(params: HeadscaleRegisterParams): Promise<HeadscaleRegisterResult>;

  /**
   * Get WireGuard configuration from Headscale
   * @param baseUrl - Headscale server URL
   * @param nodeId - Node ID from registration
   * @returns WireGuard configuration
   * @throws {NetworkError} If network request fails
   * @throws {Error} If config retrieval fails
   */
  getWireGuardConfig(baseUrl: string, nodeId: string): Promise<WireGuardConfig>;
}
