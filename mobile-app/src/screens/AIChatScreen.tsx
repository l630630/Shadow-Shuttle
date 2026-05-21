/**
 * AI 对话界面
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getNLController } from '../services/nlController';
import { getVoiceInputModule } from '../services/voiceInputModule';
import { getSuggestionEngine } from '../services/suggestionEngine';
import { getSSHService, SSHConnectionConfig } from '../services/sshService';
import { AgentExecutor } from '../services/agentExecutor';
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
import { colors, typography, spacing, borderRadius, shadows, layout } from '../styles/theme';
import { useTheme } from '../hooks/useTheme';
import { EmptyState } from '../components/EmptyState';
import { SSHPasswordCard } from '../components/SSHPasswordCard';
import { aiChatScreenStyles as styles } from '../styles/aiChatScreen.styles';
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
 * AI 对话界面组件
 * 
 * Requirement 8.1: Chat-style layout (top status, middle conversation, bottom input)
 * Requirement 8.2: Display user and AI message bubbles
 */
export const AIChatScreen: React.FC<AIChatScreenProps> = ({ navigation, route }) => {
  const themeColors = useTheme();
  
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
  const agentExecutor = useRef<AgentExecutor | null>(null);
  
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

        // 优先使用上次选择的提供商，如果没有则优先使用硅基流动
        const lastSelected = await apiKeyStore.getLastSelectedProvider();
        let provider: AIProvider;
        
        if (lastSelected && configuredProviders.includes(lastSelected)) {
          provider = lastSelected;
        } else if (configuredProviders.includes('siliconflow')) {
          provider = 'siliconflow'; // 默认使用硅基流动
        } else {
          provider = configuredProviders[0];
        }

        console.log('🔧 Auto-initializing AI provider:', provider, lastSelected ? '(last selected)' : (provider === 'siliconflow' ? '(default: siliconflow)' : '(first configured)'));
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

    addMessage(activeConversation.id, userMessage);
    setInputText('');
    setShowSuggestions(false);
    setIsProcessing(true);

    // 构建命令上下文
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

    try {
      // 有 SSH 连接时使用 Agent 模式
      if (sshSessionId) {
        await sendMessageAgent(userMessage, context);
      } else {
        // 无 SSH 连接时降级为单步解析模式
        await sendMessageSingleStep(userMessage, context);
      }
    } catch (error) {
      console.error('处理消息出错:', error);
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
   * Agent 模式：多步自动执行
   * 使用 AgentExecutor 规划 → 执行 → 评估循环
   */
  const sendMessageAgent = async (userMessage: Message, context: CommandContext) => {
    if (!activeConversation || !sshSessionId) return;

    // 创建 Agent 计划消息（先占位，事件回调中更新）
    const planMessageId = `msg-plan-${Date.now()}`;
    const planMessage: Message = {
      id: planMessageId,
      role: 'assistant',
      content: 'AI 正在规划执行步骤...',
      timestamp: new Date(),
      type: 'agent_plan',
      metadata: {
        isAgentMode: true,
        agentStatus: 'planning',
      },
    };
    addMessage(activeConversation.id, planMessage);

    // 创建 AgentExecutor 实例
    const executor = new AgentExecutor({ maxSteps: 10 });
    agentExecutor.current = executor;

    // 步骤结果累积
    const stepResults: Array<{ stepId: string; command: string; output: string; success: boolean; exitCode: number }> = [];

    await executor.run(
      userMessage.content,
      context,
      sshSessionId,
      // 事件回调：更新 UI
      (event) => {
        switch (event.type) {
          case 'plan_created':
            updateMessage(activeConversation.id, planMessageId, {
              content: event.plan.thought,
              metadata: {
                isAgentMode: true,
                agentStatus: 'executing',
                agentPlan: {
                  thought: event.plan.thought,
                  steps: event.plan.steps.map(s => ({
                    id: s.id,
                    command: s.command,
                    explanation: s.explanation,
                    riskLevel: s.riskLevel,
                    requiresConfirmation: s.requiresConfirmation,
                  })),
                  completionCriteria: event.plan.completionCriteria,
                },
                stepResults: [],
                currentStepIndex: -1,
              },
            });
            break;

          case 'step_start':
            updateMessage(activeConversation.id, planMessageId, {
              metadata: {
                isAgentMode: true,
                agentStatus: 'executing',
                agentPlan: planMessage.metadata?.agentPlan,
                stepResults: [...stepResults],
                currentStepIndex: event.stepIndex,
              },
            });
            break;

          case 'step_done':
            stepResults.push({
              stepId: event.result.stepId,
              command: event.result.command,
              output: event.result.output,
              success: event.result.success,
              exitCode: event.result.exitCode,
            });
            updateMessage(activeConversation.id, planMessageId, {
              metadata: {
                isAgentMode: true,
                agentStatus: 'executing',
                agentPlan: planMessage.metadata?.agentPlan,
                stepResults: [...stepResults],
                currentStepIndex: event.stepIndex,
              },
            });
            break;

          case 'step_needs_confirmation':
            updateMessage(activeConversation.id, planMessageId, {
              metadata: {
                isAgentMode: true,
                agentStatus: 'waiting_confirmation',
                agentPlan: planMessage.metadata?.agentPlan,
                stepResults: [...stepResults],
                currentStepIndex: event.stepIndex,
              },
            });
            break;

          case 'agent_done':
            updateMessage(activeConversation.id, planMessageId, {
              content: event.summary,
              metadata: {
                isAgentMode: true,
                agentStatus: 'completed',
                agentPlan: {
                  ...(planMessage.metadata?.agentPlan || { thought: '', steps: [], completionCriteria: '' }),
                  summary: event.summary,
                },
                stepResults: [...stepResults],
              },
            });
            // 记录到命令历史
            for (const r of stepResults) {
              commandHistoryStore.addEntry({
                id: `hist-${Date.now()}-${r.stepId}`,
                timestamp: new Date(),
                deviceId: currentDevice!.id,
                deviceName: currentDevice!.name,
                userInput: userMessage.content,
                parsedCommand: r.command,
                output: r.output,
                exitCode: r.exitCode,
                executionTime: 0,
                isDangerous: false,
              }).catch(() => {});
            }
            break;

          case 'agent_error':
            // 添加错误消息
            const errMsg: Message = {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: `执行出错: ${event.error}`,
              timestamp: new Date(),
            };
            addMessage(activeConversation.id, errMsg);
            // 更新计划状态
            updateMessage(activeConversation.id, planMessageId, {
              metadata: {
                isAgentMode: true,
                agentStatus: 'aborted',
                agentPlan: planMessage.metadata?.agentPlan,
                stepResults: [...stepResults],
              },
            });
            break;

          case 'max_steps_reached':
            updateMessage(activeConversation.id, planMessageId, {
              content: `已达到最大执行步数 (${event.stepsExecuted})`,
              metadata: {
                isAgentMode: true,
                agentStatus: 'completed',
                agentPlan: {
                  ...(planMessage.metadata?.agentPlan || { thought: '', steps: [], completionCriteria: '' }),
                  summary: `已执行 ${event.stepsExecuted} 步，达到上限`,
                },
                stepResults: [...stepResults],
              },
            });
            break;
        }
      },
      // 高风险命令确认回调
      async (step) => {
        return new Promise((resolve) => {
          Alert.alert(
            '⚠️ 确认执行高风险命令',
            `命令: ${step.command}\n说明: ${step.explanation}\n风险级别: ${step.riskLevel}`,
            [
              { text: '取消', onPress: () => resolve(false), style: 'cancel' },
              { text: '确认执行', onPress: () => resolve(true) },
            ]
          );
        });
      },
    );

    agentExecutor.current = null;
  };

  /**
   * 单步模式（无 SSH 连接时的降级方案）
   * 只解析命令并展示，不执行
   */
  const sendMessageSingleStep = async (userMessage: Message, context: CommandContext) => {
    if (!activeConversation) return;

    const parseResult: ParseResult = await nlController.parseNaturalLanguage(
      userMessage.content,
      context
    );

    if (!parseResult.success || !parseResult.command) {
      let errorContent = parseResult.error || '抱歉，我无法理解您的请求。请尝试重新描述。';

      if (errorContent.includes('Quota exceeded') || errorContent.includes('quota')) {
        const provider = nlController.getCurrentProvider();
        const providerName = provider === 'siliconflow' ? '硅基流动' :
                            provider === 'gemini' ? 'Gemini' :
                            provider === 'openai' ? 'OpenAI' : 'Claude';
        errorContent = `😔 API 配额已用完\n\n您的 ${providerName} API 配额已达到限制。\n\n💡 解决方案：\n1. 等待配额重置\n2. 切换到其他 AI 提供商（推荐：硅基流动）\n3. 升级到付费版\n\n👉 进入"个人中心" → "AI 设置"可以切换 AI 提供商`;
      }
      if (errorContent.includes('Invalid API key') || errorContent.includes('API key')) {
        errorContent = '🔑 API 密钥无效\n\n请检查您的 API 密钥是否正确。\n\n💡 解决方案：\n1. 进入"个人中心" → "AI 设置"\n2. 重新输入正确的 API 密钥\n3. 确保密钥没有过期或被撤销';
      }
      if (errorContent.includes('timeout') || errorContent.includes('network')) {
        errorContent = '🌐 网络连接超时\n\nAI 服务响应超时，可能是网络问题。\n\n💡 解决方案：\n1. 检查网络连接\n2. 稍后重试\n3. 尝试切换到其他 AI 提供商';
      }

      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };
      addMessage(activeConversation.id, errorMessage);
      return;
    }

    // 展示解析结果（不执行）
    const requiresConfirmation = parseResult.requiresConfirmation !== false && parseResult.isDangerous;
    const aiMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: parseResult.explanation || '我理解了您的请求',
      timestamp: new Date(),
      metadata: {
        command: parseResult.command,
        isDangerous: parseResult.isDangerous,
        requiresConfirmation,
        riskLevel: parseResult.riskLevel,
      },
    };
    addMessage(activeConversation.id, aiMessage);

    // 有 SSH 连接时自动执行低风险命令
    if (!requiresConfirmation && sshSessionId) {
      setTimeout(() => {
        executeCommand(parseResult.command!, aiMessage.id);
      }, 500);
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

    try {
      // 更新消息状态为执行中
      updateMessage(activeConversation.id, messageId, {
        metadata: { command, isConfirmed: true },
      });

      // 使用标记法可靠捕获命令输出（替代旧的 500ms 超时方案）
      const { output: commandOutput, timedOut } = await sshService.writeAndWait(sshSessionId, command);
      const executionTime = Date.now() - startTime;

      // 格式化并清理输出
      const formattedOutput = formatCommandOutput(commandOutput, command);

      // 输出过长时截断
      const finalOutput = isOutputTooLong(formattedOutput)
        ? truncateOutput(formattedOutput, 100)
        : formattedOutput;

      // 在聊天中显示命令输出
      const resultMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: timedOut
          ? (finalOutput || '命令执行超时') + '\n\n⚠️ 命令未在规定时间内完成，输出可能不完整'
          : finalOutput || '命令已执行完成（无输出）',
        timestamp: new Date(),
        type: 'command',
      };

      addMessage(activeConversation.id, resultMessage);

      // 记录到命令历史
      await commandHistoryStore.addEntry({
        id: `hist-${Date.now()}`,
        timestamp: new Date(),
        deviceId: currentDevice.id,
        deviceName: currentDevice.name,
        userInput: messages.find(m => m.metadata?.command === command)?.content || '',
        parsedCommand: command,
        output: commandOutput || '(命令已执行，无输出)',
        exitCode: timedOut ? -1 : 0,
        executionTime: executionTime,
        isDangerous: false,
      });
    } catch (error) {
      console.error('执行命令出错:', error);

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

      // 记录失败的执行到历史
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
        onAgentStop={(msgId) => {
          console.log('Agent stop requested:', msgId);
          if (agentExecutor.current) {
            agentExecutor.current.abort();
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
        <EmptyState
          icon="devices"
          title="暂无设备"
          description="请先添加设备才能使用 AI 助手"
          action={
            <TouchableOpacity
              style={[styles.addDeviceButtonLarge, { backgroundColor: colors.primary }, shadows.md]}
              onPress={() => navigation.navigate('QRScanner')}
              activeOpacity={0.8}
            >
              <Icon name="add" size={24} color="#FFFFFF" />
              <Text style={styles.addDeviceButtonText}>添加设备</Text>
            </TouchableOpacity>
          }
        />
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

          <SSHPasswordCard
            icon="smart-toy"
            title="连接到设备"
            subtitle="需要 SSH 连接才能执行 AI 生成的命令"
            meshIP={currentDevice.meshIP}
            password={password}
            onPasswordChange={setPassword}
            onConnect={handleConnect}
            onCancel={() => navigation.goBack()}
            connecting={connecting}
          />
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
        // 再稍微减小偏移量，让输入区更贴近键盘
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
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
            <EmptyState
              icon="smart-toy"
              title="👋 你好！我是 AI 助手"
              description="用自然语言告诉我你想做什么，我会帮你生成命令"
            />
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

export default AIChatScreen;
