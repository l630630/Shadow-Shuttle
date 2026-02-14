/**
 * QR Scanner Screen
 * Scans QR codes to pair new devices using camera
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDeviceStore } from '../stores/deviceStore';
import { getQRCodeService } from '../services/qrCodeService';
import { createGRPCClient } from '../services/grpcClient';
import { Header } from '../components/Header';
import { colors, typography, spacing, borderRadius, shadows, getThemeColors } from '../styles/theme';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

interface QRScannerScreenProps {
  navigation: any;
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation }) => {
  const [scanning, setScanning] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const { addDevice } = useDeviceStore();
  const qrService = getQRCodeService();
  const isDarkMode = true; // 强制 Dark 模式
  const themeColors = getThemeColors(isDarkMode);
  
  const handleQRCodeScanned = async (e: any) => {
    if (!scanning) return;
    
    setScanning(false);
    const data = e.data;
    
    try {
      const pairingCode = qrService.parsePairingCode(data);
      
      if (!qrService.validateTimestamp(pairingCode)) {
        Alert.alert(
          '二维码已过期',
          '此配对码已过期，请重新生成',
          [{ text: '确定', onPress: () => setScanning(true) }]
        );
        return;
      }
      
      const grpcClient = createGRPCClient(pairingCode.meshIP, pairingCode.grpcPort);
      const deviceInfo = await grpcClient.getDeviceInfo();
      const device = qrService.pairingCodeToDevice(pairingCode, deviceInfo);
      await addDevice(device);
      
      Alert.alert(
        '设备已添加',
        `成功配对 ${device.name}`,
        [{ text: '确定', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '配对失败';
      Alert.alert(
        '配对失败',
        errorMessage,
        [{ text: '重试', onPress: () => setScanning(true) }]
      );
    }
  };
  
  const handleManualTest = () => {
    const testQRData = `shadow://pair?deviceId=device-${Date.now()}&meshIP=100.64.0.2&sshPort=22&grpcPort=50052&publicKey=test_public_key&timestamp=${Date.now()}&signature=test_signature`;
    handleQRCodeScanned({ data: testQRData });
  };
  
  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: 'rgba(0, 0, 0, 0.95)' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>返回</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: '#FFFFFF' }]}>扫描二维码</Text>
          <Text style={[styles.subtitle, { color: '#CCCCCC' }]}>
            将相机对准电脑上显示的二维码
          </Text>
        </View>
      </View>
      
      <View style={styles.scannerContainer}>
        <QRCodeScanner
          onRead={handleQRCodeScanned}
          reactivate={scanning}
          reactivateTimeout={3000}
          showMarker={true}
          markerStyle={styles.marker}
          cameraStyle={styles.camera}
          topViewStyle={styles.cameraTop}
          bottomViewStyle={styles.cameraBottom}
        />
      </View>

      <View style={[styles.actions, { backgroundColor: 'rgba(0, 0, 0, 0.95)' }]}>
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: colors.primary }]}
          onPress={handleManualTest}
          disabled={!scanning}
        >
          <Icon name="devices" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.testButtonText}>
            {scanning ? '使用测试设备' : '处理中...'}
          </Text>
        </TouchableOpacity>

        {showInstructions && (
          <View style={[styles.instructions, { borderTopColor: '#333' }]}>
            <View style={styles.instructionsHeaderRow}>
              <View style={styles.instructionHeader}>
                <Icon name="info-outline" size={24} color={colors.primary} />
                <Text style={[styles.instructionsTitle, { color: '#FFFFFF' }]}>
                  配对步骤
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowInstructions(false)}
                style={styles.closeInstructionsButton}
              >
                <Icon name="close" size={18} color="#888888" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.instructionsText, { color: '#CCCCCC' }]}>
                  在要访问的设备上运行：
                </Text>
                <View style={[styles.codeBlock, { backgroundColor: '#1A1A1A' }]}>
                  <Icon name="terminal" size={16} color={colors.success} style={styles.codeIcon} />
                  <Text style={[styles.instructionsCode, { color: colors.success }]}>
                    shadowd-generate-qr
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.instructionsText, { color: '#CCCCCC' }]}>
                  用此应用扫描终端中显示的二维码
                </Text>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.instructionsText, { color: '#CCCCCC' }]}>
                  设备将被自动添加到列表中
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
  },
  headerText: {
    flex: 1,
  },
  message: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    height: '100%',
  },
  cameraTop: {
    flex: 1,
  },
  cameraBottom: {
    flex: 1,
  },
  marker: {
    borderColor: colors.success,
    borderWidth: 3,
    borderRadius: borderRadius.xl,
  },
  actions: {
    padding: spacing.lg,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  instructions: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  instructionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  instructionsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  closeInstructionsButton: {
    padding: spacing.xs,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  stepContent: {
    flex: 1,
  },
  instructionsText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  codeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  codeIcon: {
    marginRight: spacing.sm,
  },
  instructionsCode: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
  },
});
