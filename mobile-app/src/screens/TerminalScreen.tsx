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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Device } from '../types/device';
import { getSSHService, SSHConnectionConfig } from '../services/sshService';
import { getANSIParser, ANSISegment } from '../utils/ansiParser';
import { Header } from '../components/Header';
import { spacing } from '../styles/theme';
import { useTheme } from '../hooks/useTheme';
import { SSHPasswordCard } from '../components/SSHPasswordCard';

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
  const themeColors = useTheme();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(true);
  const [password, setPassword] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const sshService = getSSHService();
  const ansiParser = getANSIParser();
  
  // 性能优化：限制输出长度，避免渲染过多内容
  const MAX_OUTPUT_LENGTH = 50000; // 最大 50KB 输出
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
        setOutput(prev => {
          const newOutput = prev + data;
          // 限制输出长度，保留最后的内容
          if (newOutput.length > MAX_OUTPUT_LENGTH) {
            return newOutput.slice(-MAX_OUTPUT_LENGTH);
          }
          return newOutput;
        });
        
        // 防抖滚动：避免频繁滚动影响性能
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          if (!isScrolling) {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }
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
      
      // Auto-focus input after connection
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
      
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
  
  // Render colored terminal output with memoization
  const renderColoredOutput = React.useMemo(() => {
    const segments = ansiParser.parse(output);
    
    return (
      <>
        {segments.map((segment: ANSISegment, index: number) => {
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
        })}
      </>
    );
  }, [output]); // 只在 output 变化时重新解析
  
  // Handle scroll events to detect user scrolling
  const handleScroll = () => {
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset scrolling state after user stops scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {needsPassword ? (
        // Password input screen with keyboard avoidance
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          // 增大偏移量，确保密码输入框始终在键盘上方可见
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <SSHPasswordCard
            title="SSH 连接"
            subtitle={`连接到 ${device.name}`}
            meshIP={device.meshIP}
            password={password}
            onPasswordChange={setPassword}
            onConnect={handleConnect}
            onCancel={() => navigation.goBack()}
            connecting={connecting}
          />
        </KeyboardAvoidingView>
      ) : (
        // Terminal screen - 使用 KeyboardAvoidingView 实现原生流畅动画
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
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.terminalContainer}
            // 增大偏移量，确保终端输入框完全在键盘上方
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.terminalOutput}
              contentContainerStyle={styles.terminalContent}
              onScroll={handleScroll}
              scrollEventThrottle={200}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.terminalText}>
                {renderColoredOutput}
              </Text>
            </ScrollView>
            
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSendCommand}
                placeholder="$ "
                placeholderTextColor="#4A5568"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                editable={!connecting && !!sessionId}
                autoFocus={false}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { opacity: (!sessionId || !input.trim()) ? 0.3 : 1 },
                ]}
                onPress={handleSendCommand}
                disabled={!sessionId || !input.trim()}
                activeOpacity={0.7}
              >
                <Icon name="send" size={22} color="#00FF00" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
  // Terminal container with keyboard avoidance
  terminalContainer: {
    flex: 1,
  },
  // Terminal screen styles - macOS Terminal 风格
  terminalOutput: {
    flex: 1,
    backgroundColor: '#000000', // 纯黑背景，像 macOS Terminal
  },
  terminalContent: {
    padding: spacing.md,
    paddingBottom: spacing.sm, // 减少底部内边距
  },
  terminalText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // iOS 使用 Menlo 字体
    fontSize: 13, // macOS Terminal 默认字体大小
    lineHeight: 18,
    color: '#00FF00', // 经典绿色终端文字
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, // 减少垂直内边距
    backgroundColor: '#000000', // 黑色背景
    borderTopWidth: 0, // 移除边框，更简洁
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2, // 减少内边距
    fontSize: 13, // 与终端输出一致
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#00FF00', // 绿色文字
    backgroundColor: '#000000', // 黑色背景
    borderWidth: 0, // 移除边框
    height: 36, // 固定高度，减少间距
  },
  sendButton: {
    width: 36, // 减小按钮尺寸
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // 透明背景
  },
});
