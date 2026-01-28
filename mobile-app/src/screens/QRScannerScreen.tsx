/**
 * QR Scanner Screen
 * Scans QR codes to pair new devices
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useDeviceStore } from '../stores/deviceStore';
import { getQRCodeService } from '../services/qrCodeService';
import { createGRPCClient } from '../services/grpcClient';

interface QRScannerScreenProps {
  navigation: any;
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation }) => {
  const [scanning, setScanning] = useState(true);
  const { addDevice } = useDeviceStore();
  const qrService = getQRCodeService();
  
  const handleQRCodeScanned = async (data: string) => {
    if (!scanning) return;
    
    setScanning(false);
    
    try {
      // Parse pairing code
      const pairingCode = qrService.parsePairingCode(data);
      
      // Validate timestamp
      if (!qrService.validateTimestamp(pairingCode)) {
        Alert.alert(
          'Invalid QR Code',
          'This pairing code has expired. Please generate a new one.',
          [{ text: 'OK', onPress: () => setScanning(true) }]
        );
        return;
      }
      
      // Fetch device info via gRPC
      const grpcClient = createGRPCClient(pairingCode.meshIP, pairingCode.grpcPort);
      const deviceInfo = await grpcClient.getDeviceInfo();
      
      // Convert to device and add to store
      const device = qrService.pairingCodeToDevice(pairingCode, deviceInfo);
      await addDevice(device);
      
      Alert.alert(
        'Device Added',
        `Successfully paired with ${device.name}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pair device';
      Alert.alert(
        'Pairing Failed',
        errorMessage,
        [{ text: 'Retry', onPress: () => setScanning(true) }]
      );
    }
  };
  
  // Placeholder for actual QR scanner
  // In real implementation, use react-native-qrcode-scanner
  const handleManualTest = () => {
    const testQRData = JSON.stringify({
      deviceId: `device-${Date.now()}`,
      meshIP: '100.64.0.2',
      sshPort: 22,
      grpcPort: 50051,
      publicKey: 'test_public_key',
      timestamp: Date.now(),
      signature: 'test_signature',
    });
    
    handleQRCodeScanned(testQRData);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan QR Code</Text>
      </View>
      
      <View style={styles.scannerContainer}>
        <View style={styles.scannerFrame}>
          <Text style={styles.scannerText}>
            Point camera at device QR code
          </Text>
        </View>
        
        {/* Placeholder for actual scanner */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={handleManualTest}
        >
          <Text style={styles.testButtonText}>
            Test with Mock Device
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to pair:</Text>
        <Text style={styles.instructionsText}>
          1. On the device you want to access, run:
        </Text>
        <Text style={styles.instructionsCode}>
          shadowd generate-qr
        </Text>
        <Text style={styles.instructionsText}>
          2. Scan the displayed QR code with this app
        </Text>
        <Text style={styles.instructionsText}>
          3. The device will be added to your list
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  testButton: {
    marginTop: 40,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  instructionsCode: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'monospace',
    backgroundColor: '#2A2A2A',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
});
