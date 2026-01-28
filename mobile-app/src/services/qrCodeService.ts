/**
 * QR Code Service for device pairing
 */

import { PairingCode, Device } from '../types/device';

const MAX_TIMESTAMP_DIFF = 5 * 60 * 1000; // 5 minutes

export class QRCodeService {
  /**
   * Parse pairing code from QR code data
   */
  parsePairingCode(qrData: string): PairingCode {
    try {
      const data = JSON.parse(qrData);
      
      // Validate required fields
      if (!data.deviceId || !data.meshIP || !data.timestamp) {
        throw new Error('Invalid pairing code: missing required fields');
      }
      
      return {
        deviceId: data.deviceId,
        meshIP: data.meshIP,
        sshPort: data.sshPort || 22,
        grpcPort: data.grpcPort || 50051,
        publicKey: data.publicKey,
        timestamp: data.timestamp,
        signature: data.signature,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to parse QR code'
      );
    }
  }
  
  /**
   * Validate pairing code timestamp to prevent replay attacks
   */
  validateTimestamp(pairingCode: PairingCode): boolean {
    const now = Date.now();
    const diff = Math.abs(now - pairingCode.timestamp);
    
    if (diff > MAX_TIMESTAMP_DIFF) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Convert pairing code to device object
   */
  pairingCodeToDevice(pairingCode: PairingCode, deviceInfo?: Partial<Device>): Device {
    return {
      id: pairingCode.deviceId,
      name: deviceInfo?.name || `Device ${pairingCode.deviceId.slice(0, 8)}`,
      hostname: deviceInfo?.hostname || pairingCode.meshIP,
      os: deviceInfo?.os || 'Unknown',
      meshIP: pairingCode.meshIP,
      sshPort: pairingCode.sshPort,
      grpcPort: pairingCode.grpcPort,
      publicKey: pairingCode.publicKey,
      online: false,
      lastSeen: new Date(),
    };
  }
  
  /**
   * Generate QR code data for sharing (for future use)
   */
  generateQRData(pairingCode: PairingCode): string {
    return JSON.stringify(pairingCode);
  }
}

// Singleton instance
let qrCodeServiceInstance: QRCodeService | null = null;

/**
 * Get QR code service singleton instance
 */
export function getQRCodeService(): QRCodeService {
  if (!qrCodeServiceInstance) {
    qrCodeServiceInstance = new QRCodeService();
  }
  return qrCodeServiceInstance;
}
