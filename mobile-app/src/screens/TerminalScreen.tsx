/**
 * Terminal Screen
 * Interactive SSH terminal interface
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  useColorScheme,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Device } from '../types/device';
import { getSSHService, SSHConnectionConfig } from '../services/sshService';
import { getANSIParser, ANSISegment } from '../utils/ansiParser';
import { Header } from '../components/Header';
import { colors, typography, spacing, borderRadius, shadows, getThemeColors } from '../styles/theme';

interface TerminalScreenProps {
  route: {
    params: {
      device: Device;
    };
  };
  navigation: any;
}

export const TerminalScreen: React.FC<TerminalScreenProps> = ({
  route,
  navigation,
}) => {
  const { device } = route.params;
  const isDarkMode = true; // 强制 Dark 模式
  const themeColors = getThemeColors(isDarkMode);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(true);
  const [password, setPassword] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const sshService = getSSHService();
  const ansiParser = getANSIParser();
  
  useEffect(() => {
    // Don't auto-connect, wait for password input
    return () => {
      if (sessionId) {
        sshService.disconnect(sessionId);
      }
    };
  }, []);
  
  const handleConnect = async () => {
    if (!password.trim()) {
      Alert.alert('错误', '请输入密码');
      return;
    }
    
    setNeedsPassword(false);
    setConnecting(true);
    
    try {
      await connectToDevice(password);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '连接失败';
      setOutput(prev => prev + `\n连接失败: ${errorMessage}\n`);
      setConnecting(false);
      setNeedsPassword(true);
      
      Alert.alert(
        '连接失败',
        errorMessage + '\n\n提示：当前使用模拟模式，任意密码都可以连接。',
        [{ text: '确定' }]
      );
    }
  };
  
  const connectToDevice = async (pwd: string) => {
    try {
      setConnecting(true);
      setOutput('正在连接到 ' + device.name + '...\n');
      
      await performConnection(pwd);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '连接失败';
      setOutput(prev => prev + `\n连接失败: ${errorMessage}\n`);
      setConnecting(false);
      setNeedsPassword(true);
      
      Alert.alert(
        '连接失败',
        errorMessage,
        [{ text: '确定' }]
      );
    }
  };
  
  const performConnection = async (password: string) => {
    try {
      const config: SSHConnectionConfig = {
        host: device.meshIP,
        port: device.sshPort,
        username: 'a0000', // TODO: Get from secure storage
        password: password,
        // privateKey: await getPrivateKey(), // TODO: Implement
      };
      
      const newSessionId = await sshService.connect(device, config);
      setSessionId(newSessionId);
      setConnecting(false);
      
      // Register callbacks BEFORE clearing output
      sshService.onData(newSessionId, (data) => {
        setOutput(prev => prev + data);
        // Auto-scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
      
      sshService.onError(newSessionId, (error) => {
        setOutput(prev => prev + `\n错误: ${error.message}\n`);
      });
      
      sshService.onClose(newSessionId, () => {
        setOutput(prev => prev + '\n连接已关闭。\n');
        Alert.alert(
          '连接已关闭',
          'SSH 连接已断开。',
          [{ text: '确定', onPress: () => navigation.goBack() }]
        );
      });
      
      // Clear connecting message after callbacks are registered
      setOutput('');
      
      // Auto-configure terminal for better display
      setTimeout(() => {
        if (newSessionId && sshService.isConnected(newSessionId)) {
          // Set simple prompt
          sshService.write(newSessionId, 'export PS1="$ "\n');
          // Disable bracketed paste mode
          sshService.write(newSessionId, 'unset zle_bracketed_paste 2>/dev/null\n');
          // Clear screen
          sshService.write(newSessionId, 'clear\n');
        }
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '连接失败';
      setOutput(prev => prev + `\n连接失败: ${errorMessage}\n`);
      setConnecting(false);
      
      Alert.alert(
        '连接失败',
        errorMessage,
        [{ text: '确定', onPress: () => navigation.goBack() }]
      );
    }
  };
  
  const handleSendCommand = async () => {
    if (!sessionId || !input.trim()) {
      return;
    }
    
    try {
      await sshService.write(sessionId, input + '\n');
      setInput('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发送命令失败';
      Alert.alert('错误', errorMessage);
    }
  };
  
  const handleDisconnect = () => {
    Alert.alert(
      '断开连接',
      '确定要断开连接吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '断开',
          style: 'destructive',
          onPress: () => {
            if (sessionId) {
              sshService.disconnect(sessionId);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };
  
  // Render colored terminal output
  const renderColoredOutput = () => {
    const segments = ansiParser.parse(output);
    
    return segments.map((segment: ANSISegment, index: number) => {
      const style: any = {
        fontFamily: 'monospace',
        fontSize: 14,
        lineHeight: 20,
      };
      
      if (segment.color) {
        style.color = segment.color;
      } else {
        style.color = '#00FF00'; // Default green
      }
      
      if (segment.backgroundColor) {
        style.backgroundColor = segment.backgroundColor;
      }
      
      if (segment.bold) {
        style.fontWeight = 'bold';
      }
      
      if (segment.italic) {
        style.fontStyle = 'italic';
      }
      
      if (segment.underline) {
        style.textDecorationLine = 'underline';
      }
      
      return (
        <Text key={index} style={style}>
          {segment.text}
        </Text>
      );
    });
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {needsPassword ? (
        // Password input screen with keyboard avoidance
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={0}
        >
          <View style={styles.passwordContainer}>
            <View style={[styles.passwordCard, { backgroundColor: themeColors.surface }, shadows.lg]}>
              <Icon name="lock-outline" size={48} color={colors.primary} style={styles.lockIcon} />
              
              <Text style={[styles.passwordTitle, { color: themeColors.textPrimary }]}>
                SSH 连接
              </Text>
              <Text style={[styles.passwordSubtitle, { color: themeColors.textSecondary }]}>
                连接到 {device.name}
              </Text>
              
              <View style={[styles.infoRow, { backgroundColor: themeColors.surfaceDarker }]}>
                <Icon name="person-outline" size={20} color={themeColors.textSecondary} />
                <Text style={[styles.infoText, { color: themeColors.textPrimary }]}>
                  用户名: a0000
                </Text>
              </View>
              
              <View style={[styles.infoRow, { backgroundColor: themeColors.surfaceDarker }]}>
                <Icon name="computer" size={20} color={themeColors.textSecondary} />
                <Text style={[styles.infoText, { color: themeColors.textPrimary }]}>
                  主机: {device.meshIP}
                </Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Icon name="vpn-key" size={20} color={themeColors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.passwordInput, { 
                    backgroundColor: themeColors.background,
                    color: themeColors.textPrimary,
                    borderColor: themeColors.border,
                  }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="请输入密码"
                  placeholderTextColor={themeColors.textMuted}
                  secureTextEntry
                  autoFocus
                  onSubmitEditing={handleConnect}
                  editable={!connecting}
                />
              </View>
              
              {connecting && (
                <View style={styles.connectingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.connectingText, { color: themeColors.textSecondary }]}>
                    正在连接...
                  </Text>
                </View>
              )}
              
              <View style={styles.passwordButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { backgroundColor: themeColors.surfaceDarker }]}
                  onPress={() => navigation.goBack()}
                  disabled={connecting}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buttonText, { color: themeColors.textPrimary }]}>
                    取消
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.connectButton,
                    { backgroundColor: (!password.trim() || connecting) ? themeColors.textMuted : colors.primary },
                    shadows.sm,
                  ]}
                  onPress={handleConnect}
                disabled={!password.trim() || connecting}
                activeOpacity={0.8}
              >
                <Icon name="login" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.connectButtonText}>连接</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      ) : (
        // Terminal screen
        <>
          <Header
            title={device.name}
            subtitle={`${device.meshIP}:${device.sshPort}`}
            showBack
            onBack={handleDisconnect}
            rightAction={{
              icon: 'close',
              onPress: handleDisconnect,
            }}
          />
          
          <ScrollView
            ref={scrollViewRef}
            style={[styles.terminalOutput, { backgroundColor: themeColors.background }]}
            contentContainerStyle={styles.terminalContent}
          >
            <Text style={[styles.terminalText, { color: colors.online }]}>
              {renderColoredOutput()}
            </Text>
          </ScrollView>
          
          <View style={[styles.inputContainer, { backgroundColor: themeColors.surfaceDarker, borderTopColor: themeColors.border }]}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: themeColors.background,
                color: themeColors.textPrimary,
                borderColor: themeColors.border,
              }]}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSendCommand}
              placeholder="输入命令..."
              placeholderTextColor={themeColors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              editable={!connecting && !!sessionId}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: (!sessionId || !input.trim()) ? themeColors.textMuted : colors.primary },
                shadows.sm,
              ]}
              onPress={handleSendCommand}
              disabled={!sessionId || !input.trim()}
              activeOpacity={0.8}
            >
              <Icon name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Keyboard avoiding view
  keyboardAvoidingView: {
    flex: 1,
  },
  // Password screen styles
  passwordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  passwordCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  lockIcon: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  passwordTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  passwordSubtitle: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.xl + spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
  },
  connectingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  connectingText: {
    fontSize: typography.fontSize.sm,
  },
  passwordButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  cancelButton: {
    // backgroundColor set dynamically
  },
  connectButton: {
    // backgroundColor set dynamically
  },
  buttonIcon: {
    // No additional styles needed
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  // Terminal screen styles
  terminalOutput: {
    flex: 1,
  },
  terminalContent: {
    padding: spacing.md,
  },
  terminalText: {
    fontFamily: 'monospace',
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
