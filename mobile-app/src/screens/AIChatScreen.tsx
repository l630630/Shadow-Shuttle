/**
 * AI Chat Screen
 * AI 对话界面
 * 
 * Chat-style interface for natural language command interaction.
 * Integrates NLController, VoiceInputModule, and SuggestionEngine.
 * 
 * 用于自然语言命令交互的聊天式界面。
 * 集成自然语言控制器、语音输入模块和命令建议引擎。
 * 
 * Requirements: 8.1, 8.2
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  useColorScheme,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getNLController } from '../services/nlController';
import { getVoiceInputModule } from '../services/voiceInputModule';
import { getSuggestionEngine } from '../services/suggestionEngine';
import { getSSHService, SSHConnectionConfig } from '../services/sshService';
import { useDeviceStore } from '../stores/deviceStore';
import { useConversationStore } from '../stores/conversationStore';
import { commandHistoryStore } from '../stores/commandHistoryStore';
import { auditLogStore } from '../stores/auditLogStore';
import {
  Message,
  CommandContext,
  ParseResult,
  ExecutionResult,
  Suggestion,
} from '../types/nlc';
import { Header } from '../components/Header';
import { ChatBubble } from '../components/ChatBubble';
import { colors, typography, spacing, borderRadius, shadows, layout, getThemeColors } from '../styles/theme';
import { formatCommandOutput, truncateOutput, isOutputTooLong } from '../utils/outputFormatter';

/**
 * AI Chat Screen Props
 */
interface AIChatScreenProps {
  navigation: any;
  route?: {
    params?: {
      device?: any; // Device object
      deviceId?: string; // Fallback for backward compatibility
    };
  };
}

/**
 * AI Chat Screen Component
 * AI 对话界面组件
 * 
 * Requirement 8.1: Chat-style layout (top status, middle conversation, bottom input)
 * Requirement 8.2: Display user and AI message bubbles
 */
export const AIChatScreen: React.FC<AIChatScreenProps> = ({ navigation, route }) => {
  const isDarkMode = true; // 强制 Dark 模式
  const themeColors = getThemeColors(isDarkMode);
  
  // Device store
  const { devices, loadDevices } = useDeviceStore();
  
  // State
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSessionId, setRecordingSessionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDeviceSelectorOpen, setIsDeviceSelectorOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [devicesLoaded, setDevicesLoaded] = useState(false);
  
  // SSH connection state
  const [needsPassword, setNeedsPassword] = useState(false); // ✨ 默认不显示密码界面
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [sshSessionId, setSshSessionId] = useState<string | null>(null);
  const [isCheckingPassword, setIsCheckingPassword] = useState(true); // ✨ 检查密码状态
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const nlController = useRef(getNLController()).current;
  // Lazy initialize voice module to avoid NativeEventEmitter warning
  // 延迟初始化语音模块以避免 NativeEventEmitter 警告
  const voiceModule = useRef<ReturnType<typeof getVoiceInputModule> | null>(null);
  const suggestionEngine = useRef(getSuggestionEngine()).current;
  const sshService = useRef(getSSHService()).current;
  
  // Get voice module instance (lazy)
  const getVoiceModule = () => {
    if (!voiceModule.current) {
      voiceModule.current = getVoiceInputModule();
    }
    return voiceModule.current;
  };
  
  // Load devices on mount
  useEffect(() => {
    console.log('🔵 [AIChatScreen] Component mounted, loading devices...');
    const initDevices = async () => {
      console.log('🔵 [AIChatScreen] Calling loadDevices()...');
      await loadDevices();
      console.log('🔵 [AIChatScreen] loadDevices() completed');
      setDevicesLoaded(true);
      console.log('🔵 [AIChatScreen] devicesLoaded set to true');
    };
    initDevices();
  }, []);
  
  // Log devices changes
  useEffect(() => {
    console.log('🔵 [AIChatScreen] Devices changed:', {
      count: devices.length,
      devices: devices.map(d => ({ id: d.id, name: d.name, online: d.online })),
    });
  }, [devices]);
  
  // Select initial device after devices are loaded
  useEffect(() => {
    console.log('🔵 [AIChatScreen] Device selection effect triggered:', {
      devicesLoaded,
      devicesCount: devices.length,
      selectedDeviceId,
    });
    
    if (devicesLoaded && devices.length > 0 && !selectedDeviceId) {
      console.log('🔵 [AIChatScreen] Selecting initial device...');
      
      // Priority: route params > first online device > first device
      const initialDevice = route?.params?.device || 
        (route?.params?.deviceId ? devices.find(d => d.id === route.params?.deviceId) : null) ||
        devices.find(d => d.online) || // ✨ 优先选择在线设备
        devices[0];
      
      if (initialDevice) {
        console.log('✅ [AIChatScreen] Auto-selected device:', {
          id: initialDevice.id,
          name: initialDevice.name,
          online: initialDevice.online,
        });
        setSelectedDeviceId(initialDevice.id);
      } else {
        console.log('❌ [AIChatScreen] No device found to select');
      }
    }
  }, [devicesLoaded, devices, selectedDeviceId]);
  
  // Get current device from selectedDeviceId state
  const currentDevice = devices.find(d => d.id === selectedDeviceId);

  // Conversation store (Requirement 8.6, 8.7)
  const {
    getActiveConversation,
    createConversation,
    addMessage,
    updateMessage,
    clearConversation: clearConversationStore,
  } = useConversationStore();

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];

  // Initialize conversation on mount and when device changes
  useEffect(() => {
    if (currentDevice) {
      // Set selectedDeviceId if not set
      if (!selectedDeviceId) {
        setSelectedDeviceId(currentDevice.id);
      }
      
      // Create conversation if not exists
      if (!activeConversation || activeConversation.deviceId !== currentDevice.id) {
        const context: CommandContext = {
          currentDirectory: '~',
          deviceInfo: {
            id: currentDevice.id,
            name: currentDevice.name,
            os: currentDevice.os === 'windows' || currentDevice.os === 'macos' || currentDevice.os === 'linux' 
              ? currentDevice.os 
              : 'linux',
            shell: 'bash',
            currentDirectory: '~',
            username: 'user',
            hostname: currentDevice.hostname,
          },
          recentCommands: [],
          conversationHistory: [],
        };
        
        createConversation(currentDevice.id, context);
      }
      
      // ✨ 自动加载保存的密码
      loadSavedPassword();
    }
  }, [currentDevice, selectedDeviceId]);

  /**
   * Load saved password for current device
   * 加载当前设备的保存密码
   */
  const loadSavedPassword = async () => {
    if (!currentDevice) return;
    
    setIsCheckingPassword(true);
    
    try {
      const { getKeyStorageService } = await import('../services/keyStorageService');
      const keyStorage = getKeyStorageService();
      
      const savedPassword = await keyStorage.getPassword(currentDevice.id);
      
      if (savedPassword) {
        console.log('✅ Found saved password for device:', currentDevice.id);
        setPassword(savedPassword);
        
        // 自动连接（不显示密码输入界面）
        await autoConnect(savedPassword);
      } else {
        console.log('ℹ️ No saved password for device:', currentDevice.id);
        // 没有保存的密码，显示密码输入界面
        setNeedsPassword(true);
        setIsCheckingPassword(false);
      }
    } catch (error) {
      console.error('Failed to load saved password:', error);
      // 加载失败，显示密码输入界面
      setNeedsPassword(true);
      setIsCheckingPassword(false);
    }
  };

  /**
   * Auto-connect with saved password
   * 使用保存的密码自动连接
   */
  const autoConnect = async (savedPassword: string) => {
    if (!currentDevice) return;
    
    setConnecting(true);
    setIsCheckingPassword(true);
    
    try {
      const config: SSHConnectionConfig = {
        host: currentDevice.meshIP,
        port: currentDevice.sshPort,
        username: 'a0000',
        password: savedPassword,
      };
      
      const sessionId = await sshService.connect(currentDevice, config);
      setSshSessionId(sessionId);
      setNeedsPassword(false);
      setConnecting(false);
      setIsCheckingPassword(false);
      
      console.log('✅ Auto-connected successfully');
      
      // ✨ 不再自动发送欢迎消息
    } catch (error) {
      console.error('Auto-connect failed:', error);
      setConnecting(false);
      setIsCheckingPassword(false);
      // 自动连接失败，显示密码输入界面（密码可能已过期或错误）
      setNeedsPassword(true);
      
      // 显示错误提示
      Alert.alert(
        '自动连接失败',
        '保存的密码可能已过期，请重新输入密码',
        [{ text: '确定' }]
      );
    }
  };

  // Initialize AI provider on mount
  useEffect(() => {
    const initializeAIProvider = async () => {
      try {
        const currentProvider = nlController.getCurrentProvider();
        const { apiKeyStore } = await import('../stores/apiKeyStore');
        const configuredProviders = await apiKeyStore.getConfiguredProviders();

        if (currentProvider) {
          console.log('✅ AI provider already initialized:', currentProvider);
          return;
        }

        if (configuredProviders.length === 0) {
          console.warn('⚠️ No AI providers configured');
          return;
        }

        // 优先使用上次选择的提供商
        const lastSelected = await apiKeyStore.getLastSelectedProvider();
        const provider =
          lastSelected && configuredProviders.includes(lastSelected)
            ? lastSelected
            : configuredProviders[0];

        console.log('🔧 Auto-initializing AI provider:', provider, lastSelected ? '(last selected)' : '(first configured)');
        await nlController.setAIProvider(provider);
        console.log('✅ AI provider initialized:', provider);
      } catch (error) {
        console.error('❌ Failed to initialize AI provider:', error);
      }
    };

    initializeAIProvider();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Load suggestions when input changes
  useEffect(() => {
    if (inputText.trim().length > 0) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputText]);

  /**
   * Load command suggestions
   * 加载命令建议
   */
  const loadSuggestions = async () => {
    if (!currentDevice) return;

    try {
      const context: CommandContext = {
        currentDirectory: '~',
        deviceInfo: {
          id: currentDevice.id,
          name: currentDevice.name,
          os: currentDevice.os === 'windows' || currentDevice.os === 'macos' || currentDevice.os === 'linux' 
            ? currentDevice.os 
            : 'linux',
          shell: 'bash',
          currentDirectory: '~',
          username: 'user',
          hostname: currentDevice.hostname,
        },
        recentCommands: [],
        conversationHistory: messages,
      };

      const results = await suggestionEngine.getSuggestions(inputText, context);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  /**
   * Connect to SSH
   * 连接 SSH
   */
  const handleConnect = async () => {
    if (!password.trim()) {
      Alert.alert('错误', '请输入密码');
      return;
    }
    
    if (!currentDevice) {
      Alert.alert('错误', '未选择设备');
      return;
    }
    
    setConnecting(true);
    
    try {
      const config: SSHConnectionConfig = {
        host: currentDevice.meshIP,
        port: currentDevice.sshPort,
        username: 'a0000', // TODO: Get from secure storage
        password: password,
      };
      
      const sessionId = await sshService.connect(currentDevice, config);
      setSshSessionId(sessionId);
      setNeedsPassword(false);
      setConnecting(false);
      
      // ✨ 保存密码到安全存储
      try {
        const { getKeyStorageService } = await import('../services/keyStorageService');
        const keyStorage = getKeyStorageService();
        await keyStorage.storePassword(currentDevice.id, password);
        console.log('✅ Password saved for device:', currentDevice.id);
      } catch (error) {
        console.error('Failed to save password:', error);
        // 不影响连接，只是记录错误
      }
      
      // ✨ 不再自动发送欢迎消息
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '连接失败';
      setConnecting(false);
      Alert.alert('连接失败', errorMessage, [{ text: '确定' }]);
    }
  };

  /**
   * Send message
   * 发送消息
   * 
   * Requirement 8.2: Display user message bubble immediately
   * Requirement 8.6: Append message to conversation
   */
  const sendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    if (!currentDevice || !activeConversation) {
      Alert.alert('错误', '请先选择一个设备');
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    // Add user message to conversation (Requirement 8.6)
    addMessage(activeConversation.id, userMessage);
    setInputText('');
    setShowSuggestions(false);
    setIsProcessing(true);

    try {
      // Build command context
      const context: CommandContext = {
        currentDirectory: '~',
        deviceInfo: {
          id: currentDevice.id,
          name: currentDevice.name,
          os: currentDevice.os === 'windows' || currentDevice.os === 'macos' || currentDevice.os === 'linux' 
            ? currentDevice.os 
            : 'linux',
          shell: 'bash',
          currentDirectory: '~',
          username: 'user',
          hostname: currentDevice.hostname,
        },
        recentCommands: [],
        conversationHistory: messages,
      };

      // Parse natural language
      const parseResult: ParseResult = await nlController.parseNaturalLanguage(
        userMessage.content,
        context
      );

      if (!parseResult.success || !parseResult.command) {
        // ✨ 改进错误提示，提供更友好的解决方案
        let errorContent = parseResult.error || '抱歉，我无法理解您的请求。请尝试重新描述。';
        
        // 检查是否是配额超限错误
        if (errorContent.includes('Quota exceeded') || errorContent.includes('quota')) {
          const provider = nlController.getCurrentProvider();
          const providerName = provider === 'siliconflow' ? '硅基流动' : 
                              provider === 'gemini' ? 'Gemini' :
                              provider === 'openai' ? 'OpenAI' : 'Claude';
          
          errorContent = `😔 API 配额已用完\n\n` +
            `您的 ${providerName} API 配额已达到限制。\n\n` +
            `💡 解决方案：\n` +
            `1. 等待配额重置\n` +
            `2. 切换到其他 AI 提供商（推荐：硅基流动）\n` +
            `3. 升级到付费版\n\n` +
            `👉 进入"个人中心" → "AI 设置"可以切换 AI 提供商`;
        }
        
        // 检查是否是 API Key 错误
        if (errorContent.includes('Invalid API key') || errorContent.includes('API key')) {
          errorContent = '🔑 API 密钥无效\n\n' +
            '请检查您的 API 密钥是否正确。\n\n' +
            '💡 解决方案：\n' +
            '1. 进入"个人中心" → "AI 设置"\n' +
            '2. 重新输入正确的 API 密钥\n' +
            '3. 确保密钥没有过期或被撤销';
        }
        
        // 检查是否是网络错误
        if (errorContent.includes('timeout') || errorContent.includes('network')) {
          errorContent = '🌐 网络连接超时\n\n' +
            'AI 服务响应超时，可能是网络问题。\n\n' +
            '💡 解决方案：\n' +
            '1. 检查网络连接\n' +
            '2. 稍后重试\n' +
            '3. 尝试切换到其他 AI 提供商';
        }
        
        // Show error message
        const errorMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
        };
        addMessage(activeConversation.id, errorMessage);
        return;
      }

      // Check if command requires confirmation
      const requiresConfirmation = parseResult.requiresConfirmation !== false && parseResult.isDangerous;

      // Show AI response with command
      const aiMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: parseResult.explanation || '我理解了您的请求',
        timestamp: new Date(),
        metadata: {
          command: parseResult.command,
          isDangerous: parseResult.isDangerous,
          requiresConfirmation, // ✨ 新增
          riskLevel: parseResult.riskLevel, // ✨ 新增
        },
      };

      console.log('[AI_MESSAGE] Adding AI message with metadata:', {
        command: aiMessage.metadata?.command,
        isDangerous: aiMessage.metadata?.isDangerous,
        requiresConfirmation: aiMessage.metadata?.requiresConfirmation,
        riskLevel: aiMessage.metadata?.riskLevel,
        hasMetadata: !!aiMessage.metadata,
      });

      addMessage(activeConversation.id, aiMessage);

      // ✨ 自动执行低风险命令
      if (!requiresConfirmation && sshSessionId) {
        console.log('[AUTO_EXECUTE] Executing safe command automatically:', parseResult.command);
        
        // 延迟 500ms 让用户看到 AI 的解释
        setTimeout(() => {
          executeCommand(parseResult.command!, aiMessage.id);
        }, 500);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: '处理请求时出错，请稍后重试。',
        timestamp: new Date(),
      };
      
      if (activeConversation) {
        addMessage(activeConversation.id, errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Switch device
   * 切换设备
   */
  const switchDevice = async (deviceId: string) => {
    setIsDeviceSelectorOpen(false);
    
    // 如果切换到相同设备，不做任何操作
    if (deviceId === selectedDeviceId) {
      return;
    }
    
    // 断开当前 SSH 连接
    if (sshSessionId) {
      try {
        await sshService.disconnect(sshSessionId);
        console.log('✅ Disconnected from current device');
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
    
    // 重置连接状态
    setSshSessionId(null);
    setNeedsPassword(false);
    setPassword('');
    setIsCheckingPassword(true);
    
    // 更新选中的设备
    setSelectedDeviceId(deviceId);
    
    // 获取新设备
    const device = devices.find(d => d.id === deviceId);
    if (!device) {
      console.error('Device not found:', deviceId);
      return;
    }
    
    // 创建新的对话
    const context: CommandContext = {
      currentDirectory: '~',
      deviceInfo: {
        id: device.id,
        name: device.name,
        os: device.os === 'windows' || device.os === 'macos' || device.os === 'linux' 
          ? device.os 
          : 'linux',
        shell: 'bash',
        currentDirectory: '~',
        username: 'user',
        hostname: device.hostname,
      },
      recentCommands: [],
      conversationHistory: [],
    };
    
    createConversation(device.id, context);
    
    // 加载新设备的保存密码并自动连接
    try {
      const { getKeyStorageService } = await import('../services/keyStorageService');
      const keyStorage = getKeyStorageService();
      
      const savedPassword = await keyStorage.getPassword(device.id);
      
      if (savedPassword) {
        console.log('✅ Found saved password for new device:', device.id);
        setPassword(savedPassword);
        
        // 自动连接到新设备
        await autoConnectToDevice(device, savedPassword);
      } else {
        console.log('ℹ️ No saved password for new device:', device.id);
        // 没有保存的密码，显示密码输入界面
        setNeedsPassword(true);
        setIsCheckingPassword(false);
      }
    } catch (error) {
      console.error('Failed to load saved password for new device:', error);
      setNeedsPassword(true);
      setIsCheckingPassword(false);
    }
  };
  
  /**
   * Auto-connect to a specific device
   * 自动连接到指定设备
   */
  const autoConnectToDevice = async (device: any, savedPassword: string) => {
    setConnecting(true);
    setIsCheckingPassword(true);
    
    try {
      const config: SSHConnectionConfig = {
        host: device.meshIP,
        port: device.sshPort,
        username: 'a0000',
        password: savedPassword,
      };
      
      const sessionId = await sshService.connect(device, config);
      setSshSessionId(sessionId);
      setNeedsPassword(false);
      setConnecting(false);
      setIsCheckingPassword(false);
      
      console.log('✅ Auto-connected to new device successfully:', device.name);
    } catch (error) {
      console.error('Auto-connect to new device failed:', error);
      setConnecting(false);
      setIsCheckingPassword(false);
      setNeedsPassword(true);
      
      Alert.alert(
        '自动连接失败',
        `无法连接到 ${device.name}，请输入密码`,
        [{ text: '确定' }]
      );
    }
  };

  /**
   * Execute command
   * 执行命令
   */
  const executeCommand = async (command: string, messageId: string) => {
    if (!currentDevice || !activeConversation) return;
    
    if (!sshSessionId) {
      Alert.alert('错误', 'SSH 连接已断开，请重新连接');
      return;
    }

    const startTime = Date.now();
    let commandOutput = '';
    let exitCode = 0;

    try {
      // Update message to show execution in progress
      updateMessage(activeConversation.id, messageId, {
        metadata: { command, isConfirmed: true },
      });

      // Create a promise to capture command output
      const outputPromise = new Promise<string>((resolve) => {
        let buffer = '';
        let timeoutId: NodeJS.Timeout;
        let isActive = true;
        
        const outputCallback = (data: string) => {
          if (!isActive) return;
          buffer += data;
          
          // Reset timeout on each data chunk
          clearTimeout(timeoutId);
          
          // Wait 500ms after last output to consider command complete
          timeoutId = setTimeout(() => {
            if (isActive) {
              isActive = false;
              resolve(buffer);
            }
          }, 500);
        };

        // Register callback
        sshService.onData(sshSessionId, outputCallback);
        
        // Fallback timeout (10 seconds max)
        setTimeout(() => {
          if (isActive) {
            isActive = false;
            resolve(buffer || '(命令执行超时或无输出)');
          }
        }, 10000);
      });

      // Execute command via SSH
      await sshService.write(sshSessionId, command + '\n');
      
      // Wait for command output
      commandOutput = await outputPromise;

      const executionTime = Date.now() - startTime;

      // Format and clean output
      const formattedOutput = formatCommandOutput(commandOutput, command);
      
      // Truncate if too long
      const finalOutput = isOutputTooLong(formattedOutput) 
        ? truncateOutput(formattedOutput, 100)
        : formattedOutput;

      // Show command output in chat
      const resultMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: finalOutput || '命令已执行完成（无输出）',
        timestamp: new Date(),
        type: 'command',
      };

      addMessage(activeConversation.id, resultMessage);

      // Record in history with captured output
      await commandHistoryStore.addEntry({
        id: `hist-${Date.now()}`,
        timestamp: new Date(),
        deviceId: currentDevice.id,
        deviceName: currentDevice.name,
        userInput: messages.find(m => m.metadata?.command === command)?.content || '',
        parsedCommand: command,
        output: commandOutput || '(命令已执行，输出已显示在终端中)',
        exitCode: exitCode,
        executionTime: executionTime,
        isDangerous: false,
      });
    } catch (error) {
      console.error('Error executing command:', error);
      
      const executionTime = Date.now() - startTime;
      
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `执行命令时出错: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
      };
      
      if (activeConversation) {
        addMessage(activeConversation.id, errorMessage);
      }

      // Record failed execution in history
      await commandHistoryStore.addEntry({
        id: `hist-${Date.now()}`,
        timestamp: new Date(),
        deviceId: currentDevice.id,
        deviceName: currentDevice.name,
        userInput: messages.find(m => m.metadata?.command === command)?.content || '',
        parsedCommand: command,
        output: error instanceof Error ? error.message : '执行失败',
        exitCode: 1,
        executionTime: executionTime,
        isDangerous: false,
      });
    }
  };

  /**
   * Start voice recording
   * 开始语音录音
   */
  const startVoiceRecording = async () => {
    try {
      const sessionId = await getVoiceModule().startRecording();
      setRecordingSessionId(sessionId);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(
        '录音失败',
        error instanceof Error ? error.message : '无法启动录音',
        [{ text: '确定' }]
      );
    }
  };

  /**
   * Stop voice recording
   * 停止语音录音
   */
  const stopVoiceRecording = async () => {
    if (!recordingSessionId) return;

    try {
      const result = await getVoiceModule().stopRecording(recordingSessionId);
      setIsRecording(false);
      setRecordingSessionId(null);

      if (result.success && result.text) {
        setInputText(result.text);
      } else {
        Alert.alert(
          '识别失败',
          result.error || '无法识别语音',
          [{ text: '确定' }]
        );
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setRecordingSessionId(null);
    }
  };

  /**
   * Select suggestion
   * 选择建议
   */
  const selectSuggestion = (suggestion: Suggestion) => {
    setInputText(suggestion.command);
    setShowSuggestions(false);
  };

  /**
   * Clear conversation
   * 清除对话
   * 
   * Requirement 8.7: Support clearing conversation history
   */
  const clearConversation = () => {
    if (!activeConversation) return;

    Alert.alert(
      '清除对话',
      '确定要清除所有对话记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => clearConversationStore(activeConversation.id),
        },
      ]
    );
  };

  /**
   * Render message bubble
   * 渲染消息气泡
   */
  const renderMessage = ({ item }: { item: Message }) => {
    const hasCommand = item.metadata?.command;
    const isDangerous = item.metadata?.isDangerous;

    console.log('🎨 Rendering message:', {
      id: item.id,
      role: item.role,
      hasCommand,
      command: item.metadata?.command,
      isDangerous,
      isConfirmed: item.metadata?.isConfirmed,
    });

    return (
      <ChatBubble
        message={item}
        onExecuteCommand={(cmd, msgId) => {
          console.log('Execute command:', cmd, msgId);
          executeCommand(cmd, msgId);
        }}
        onCancelCommand={(msgId) => {
          console.log('Cancel command:', msgId);
          if (activeConversation) {
            updateMessage(activeConversation.id, msgId, {
              metadata: { ...item.metadata, isConfirmed: false },
            });
          }
        }}
      />
    );
  };

  /**
   * Render suggestion item
   * 渲染建议项
   */
  const renderSuggestion = ({ item }: { item: Suggestion }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { backgroundColor: themeColors.surfaceDarker, borderColor: themeColors.border }]}
      onPress={() => selectSuggestion(item)}
      activeOpacity={0.7}
    >
      <Text style={[styles.suggestionCommand, { color: themeColors.textPrimary }]}>{item.command}</Text>
      <Text style={[styles.suggestionDescription, { color: themeColors.textSecondary }]}>{item.description}</Text>
    </TouchableOpacity>
  );

  // No device screen
  if (!currentDevice || devices.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Header
          title="AI 助手"
          subtitle="未连接设备"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.emptyContainer}>
          <Icon name="devices" size={64} color={themeColors.textMuted} />
          <Text style={[styles.emptyText, { color: themeColors.textPrimary }]}>
            暂无设备
          </Text>
          <Text style={[styles.emptyHint, { color: themeColors.textSecondary }]}>
            请先添加设备才能使用 AI 助手
          </Text>
          <TouchableOpacity
            style={[styles.addDeviceButtonLarge, { backgroundColor: colors.primary }, shadows.md]}
            onPress={() => navigation.navigate('QRScanner')}
            activeOpacity={0.8}
          >
            <Icon name="add" size={24} color="#FFFFFF" />
            <Text style={styles.addDeviceButtonText}>添加设备</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Password input screen (only show if needs password and not checking)
  if (needsPassword && !isCheckingPassword && currentDevice) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <Header
            title="AI 助手"
            subtitle={currentDevice.name}
            showBack
            onBack={() => navigation.goBack()}
          />

          {/* Password Card */}
          <View style={styles.passwordContainer}>
            <View style={[styles.passwordCard, { backgroundColor: themeColors.surface }, shadows.lg]}>
              <Icon name="smart-toy" size={48} color={colors.primary} style={styles.lockIcon} />
              
              <Text style={[styles.passwordTitle, { color: themeColors.textPrimary }]}>
                连接到设备
              </Text>
              <Text style={[styles.passwordSubtitle, { color: themeColors.textSecondary }]}>
                需要 SSH 连接才能执行 AI 生成的命令
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
                  主机: {currentDevice.meshIP}
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
      </SafeAreaView>
    );
  }

  // Loading screen while checking password
  if (isCheckingPassword && currentDevice) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Header
          title="AI 助手"
          subtitle={currentDevice.name}
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            正在连接到 {currentDevice.name}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <Header
          title="AI 助手"
          subtitle={currentDevice?.name}
          showBack
          onBack={() => navigation.goBack()}
          rightAction={{
            icon: 'settings',
            onPress: () => setIsDeviceSelectorOpen(true),
          }}
        />

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="smart-toy" size={64} color={themeColors.textMuted} />
              <Text style={[styles.emptyText, { color: themeColors.textPrimary }]}>
                👋 你好！我是 AI 助手
              </Text>
              <Text style={[styles.emptyHint, { color: themeColors.textSecondary }]}>
                用自然语言告诉我你想做什么，我会帮你生成命令
              </Text>
            </View>
          }
        />

        {/* Processing indicator */}
        {isProcessing && (
          <View style={[styles.processingContainer, { backgroundColor: themeColors.surface }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.processingText, { color: themeColors.textSecondary }]}>
              思考中...
            </Text>
          </View>
        )}

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(_, index) => `suggestion-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: themeColors.background, 
                  color: themeColors.textPrimary,
                  borderColor: themeColors.border,
                }
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={`发送指令给 ${currentDevice?.name}...`}
              placeholderTextColor={themeColors.textMuted}
              multiline
              maxLength={500}
              editable={!isProcessing && !isRecording}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => {
                // TODO: 实现附件功能
                Alert.alert('附件', '附件功能开发中...');
              }}
              activeOpacity={0.7}
            >
              <Icon name="attach-file" size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendIconButton}
              onPress={sendMessage}
              disabled={!inputText.trim() || isProcessing}
              activeOpacity={0.7}
            >
              <Icon 
                name="send" 
                size={20} 
                color={(!inputText.trim() || isProcessing) ? themeColors.textMuted : colors.primary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.voiceButtonLarge,
              { backgroundColor: isRecording ? colors.status.error : colors.primary },
              shadows.md,
            ]}
            onPressIn={startVoiceRecording}
            onPressOut={stopVoiceRecording}
            activeOpacity={0.8}
          >
            <Icon
              name="mic"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Device Selector Modal */}
        {isDeviceSelectorOpen && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setIsDeviceSelectorOpen(false)}
            />
            <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { backgroundColor: themeColors.surfaceDarker, borderBottomColor: themeColors.border }]}>
                <Text style={[styles.modalTitle, { color: themeColors.textPrimary }]}>
                  切换连接设备
                </Text>
                <TouchableOpacity
                  style={[styles.modalCloseButton, { backgroundColor: themeColors.background }]}
                  onPress={() => setIsDeviceSelectorOpen(false)}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Device List */}
              <FlatList
                data={devices}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.deviceList}
                renderItem={({ item: device }) => {
                  const isSelected = selectedDeviceId === device.id;
                  const isOnline = device.online;

                  return (
                    <TouchableOpacity
                      style={[
                        styles.deviceItem,
                        {
                          backgroundColor: isSelected ? colors.primary + '20' : themeColors.surfaceDarker,
                          borderColor: isSelected ? colors.primary + '80' : 'transparent',
                        },
                        !isOnline && !isSelected && styles.deviceItemOffline,
                      ]}
                      onPress={() => switchDevice(device.id)}
                      activeOpacity={0.7}
                    >
                      {/* Device Icon */}
                      <View
                        style={[
                          styles.deviceIcon,
                          {
                            backgroundColor: isSelected ? colors.primary : themeColors.background,
                          },
                        ]}
                      >
                        <Icon
                          name={device.os === 'windows' ? 'desktop-windows' : device.os === 'macos' ? 'laptop' : 'dns'}
                          size={24}
                          color={isSelected ? '#FFFFFF' : themeColors.textSecondary}
                        />
                      </View>

                      {/* Device Info */}
                      <View style={styles.deviceInfo}>
                        <View style={styles.deviceNameRow}>
                          <Text
                            style={[
                              styles.deviceName,
                              { color: isSelected ? themeColors.textPrimary : themeColors.textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            {device.name}
                          </Text>
                          {!isOnline && (
                            <View style={styles.offlineBadge}>
                              <Text style={styles.offlineBadgeText}>离线</Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.deviceIp,
                            { color: isSelected ? colors.primary + 'CC' : themeColors.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {device.meshIP}
                        </Text>
                      </View>

                      {/* Selected Indicator */}
                      {isSelected && (
                        <Icon name="check-circle" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />

              {/* Add Device Button */}
              <View style={[styles.modalFooter, { backgroundColor: themeColors.surfaceDarker, borderTopColor: themeColors.border }]}>
                <TouchableOpacity
                  style={[styles.addDeviceButton, { borderColor: themeColors.border }]}
                  onPress={() => {
                    setIsDeviceSelectorOpen(false);
                    // Navigate to add device screen
                    navigation.navigate('QRScanner');
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="add" size={18} color={themeColors.textSecondary} />
                  <Text style={[styles.addDeviceText, { color: themeColors.textSecondary }]}>
                    添加新设备
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messageList: {
    padding: spacing.lg,
    paddingBottom: layout.bottomNavHeight + spacing.xl, // 为底部导航栏留出空间
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  addDeviceButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  addDeviceButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  processingText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
  },
  suggestionsContainer: {
    borderTopWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  suggestionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    minWidth: 120,
  },
  suggestionCommand: {
    fontSize: typography.fontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
    fontWeight: typography.fontWeight.medium,
  },
  suggestionDescription: {
    fontSize: typography.fontSize.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginBottom: layout.bottomNavHeight, // 为底部导航栏留出空间
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
  },
  attachButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  deviceItemOffline: {
    opacity: 0.6,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    flex: 1,
    minWidth: 0,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deviceName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  offlineBadge: {
    backgroundColor: colors.status.error + '33',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  offlineBadgeText: {
    fontSize: 10,
    color: colors.status.error,
    fontWeight: typography.fontWeight.medium,
  },
  deviceIp: {
    fontSize: typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  addDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  addDeviceText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
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
  
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.base,
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
});

export default AIChatScreen;
