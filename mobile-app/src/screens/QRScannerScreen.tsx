/**
 * QR Scanner Screen
 * Scans QR codes to pair new devices using camera
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Linking,
  Platform,
  useColorScheme,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDeviceStore } from '../stores/deviceStore';
import { getQRCodeService } from '../services/qrCodeService';
import { createGRPCClient } from '../services/grpcClient';
import { Header } from '../components/Header';
import { colors, typography, spacing, borderRadius, shadows, getThemeColors } from '../styles/theme';

interface QRScannerScreenProps {
  navigation: any;
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation }) => {
  const [scanning, setScanning] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { addDevice } = useDeviceStore();
  const qrService = getQRCodeService();
  const isDarkMode = true; // 强制 Dark 模式
  const themeColors = getThemeColors(isDarkMode);
  
  useEffect(() => {
    checkCameraPermission();
  }, []);
  
  const checkCameraPermission = async () => {
    setHasPermission(true);
  };
  
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
  
  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Header
          title="扫描二维码"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContent}>
          <Icon name="camera" size={64} color={themeColors.textSecondary} />
          <Text style={[styles.message, { color: themeColors.textPrimary }]}>
            正在请求相机权限...
          </Text>
        </View>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Header
          title="扫描二维码"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContent}>
          <Icon name="camera-off" size={64} color={colors.error} />
          <Text style={[styles.message, { color: themeColors.textPrimary }]}>
            需要相机权限才能扫描二维码
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => Linking.openSettings()}
          >
            <Icon name="settings" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>打开设置</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColors.surface }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={20} color={themeColors.textPrimary} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, { color: themeColors.textPrimary }]}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
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
        <Text style={[styles.title, { color: '#FFFFFF' }]}>扫描二维码</Text>
        <Text style={[styles.subtitle, { color: '#CCCCCC' }]}>
          将相机对准电脑上显示的二维码
        </Text>
      </View>
      
      <QRCodeScanner
        onRead={handleQRCodeScanned}
        reactivate={scanning}
        reactivateTimeout={3000}
        showMarker={true}
        markerStyle={styles.marker}
        cameraStyle={styles.camera}
        topContent={<View />}
        bottomContent={
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
            
            <View style={[styles.instructions, { borderTopColor: '#333' }]}>
              <View style={styles.instructionHeader}>
                <Icon name="info-outline" size={24} color={colors.primary} />
                <Text style={[styles.instructionsTitle, { color: '#FFFFFF' }]}>
                  配对步骤
                </Text>
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
                      shadowd generate-qr
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
                    用此应用扫描显示的二维码
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
          </View>
        }
      />
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
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  message: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  camera: {
    height: 400,
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
