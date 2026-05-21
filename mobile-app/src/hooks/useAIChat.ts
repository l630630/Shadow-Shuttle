/**
 * AI 聊天逻辑 Hook
 * 管理消息发送、命令执行、Agent 模式等核心业务逻辑
 */

import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { getNLController } from '../services/nlController';
import { getSuggestionEngine } from '../services/suggestionEngine';
import { getSSHService } from '../services/sshService';
import { AgentExecutor } from '../services/agentExecutor';
import { useConversationStore } from '../stores/conversationStore';
import { commandHistoryStore } from '../stores/commandHistoryStore';
import {
  Message,
  CommandContext,
  ParseResult,
  Suggestion,
} from '../types/nlc';
import { formatCommandOutput, truncateOutput, isOutputTooLong } from '../utils/outputFormatter';

interface Device {
  id: string;
  name: string;
  meshIP: string;
  sshPort: number;
  hostname: string;
  os: string;
}

export const useAIChat = (device: Device | undefined, sshSessionId: string | null) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const nlController = useRef(getNLController()).current;
  const suggestionEngine = useRef(getSuggestionEngine()).current;
  const sshService = useRef(getSSHService()).current;
  const agentExecutor = useRef<AgentExecutor | null>(null);

  const {
    getActiveConversation,
    createConversation,
    addMessage,
    updateMessage,
    clearConversation: clearConversationStore,
  } = useConversationStore();

  const activeConversation = getActiveConversation();
  const messages = activeConversation?.messages || [];

  // 初始化对话
  useEffect(() => {
    if (device && (!activeConversation || activeConversation.deviceId !== device.id)) {
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
    }
  }, [device?.id]);

  // 加载命令建议
  useEffect(() => {
    if (inputText.trim().length > 0) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputText]);

  const loadSuggestions = async () => {
    if (!device) return;

    try {
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
        conversationHistory: messages,
      };

      const results = await suggestionEngine.getSuggestions(inputText, context);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    if (!device || !activeConversation) {
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
      conversationHistory: messages,
    };

    try {
      if (sshSessionId) {
        await sendMessageAgent(userMessage, context);
      } else {
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

  const sendMessageAgent = async (userMessage: Message, context: CommandContext) => {
    if (!activeConversation || !sshSessionId || !device) return;

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

    const executor = new AgentExecutor({ maxSteps: 10 });
    agentExecutor.current = executor;

    const stepResults: Array<{
      stepId: string;
      command: string;
      output: string;
      success: boolean;
      exitCode: number;
    }> = [];

    await executor.run(
      userMessage.content,
      context,
      sshSessionId,
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

          case 'agent_done':
            updateMessage(activeConversation.id, planMessageId, {
              content: event.summary,
              metadata: {
                isAgentMode: true,
                agentStatus: 'completed',
                agentPlan: {
                  ...(planMessage.metadata?.agentPlan || {
                    thought: '',
                    steps: [],
                    completionCriteria: '',
                  }),
                  summary: event.summary,
                },
                stepResults: [...stepResults],
              },
            });
            for (const r of stepResults) {
              commandHistoryStore
                .addEntry({
                  id: `hist-${Date.now()}-${r.stepId}`,
                  timestamp: new Date(),
                  deviceId: device!.id,
                  deviceName: device!.name,
                  userInput: userMessage.content,
                  parsedCommand: r.command,
                  output: r.output,
                  exitCode: r.exitCode,
                  executionTime: 0,
                  isDangerous: false,
                })
                .catch(() => {});
            }
            break;

          case 'agent_error':
            const errMsg: Message = {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: `执行出错: ${event.error}`,
              timestamp: new Date(),
            };
            addMessage(activeConversation.id, errMsg);
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
                  ...(planMessage.metadata?.agentPlan || {
                    thought: '',
                    steps: [],
                    completionCriteria: '',
                  }),
                  summary: `已执行 ${event.stepsExecuted} 步，达到上限`,
                },
                stepResults: [...stepResults],
              },
            });
            break;
        }
      },
      async (step) => {
        return new Promise(resolve => {
          Alert.alert(
            '⚠️ 确认执行高风险命令',
            `命令: ${step.command}\n说明: ${step.explanation}\n风险级别: ${step.riskLevel}`,
            [
              { text: '取消', onPress: () => resolve(false), style: 'cancel' },
              { text: '确认执行', onPress: () => resolve(true) },
            ]
          );
        });
      }
    );

    agentExecutor.current = null;
  };

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
        const providerName =
          provider === 'siliconflow'
            ? '硅基流动'
            : provider === 'gemini'
            ? 'Gemini'
            : provider === 'openai'
            ? 'OpenAI'
            : 'Claude';
        errorContent = `😔 API 配额已用完\n\n您的 ${providerName} API 配额已达到限制。\n\n💡 解决方案：\n1. 等待配额重置\n2. 切换到其他 AI 提供商（推荐：硅基流动）\n3. 升级到付费版\n\n👉 进入"个人中心" → "AI 设置"可以切换 AI 提供商`;
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

    const requiresConfirmation =
      parseResult.requiresConfirmation !== false && parseResult.isDangerous;
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

    if (!requiresConfirmation && sshSessionId) {
      setTimeout(() => {
        executeCommand(parseResult.command!, aiMessage.id);
      }, 500);
    }
  };

  const executeCommand = async (command: string, messageId: string) => {
    if (!device || !activeConversation || !sshSessionId) return;

    const startTime = Date.now();

    try {
      updateMessage(activeConversation.id, messageId, {
        metadata: { command, isConfirmed: true },
      });

      const { output: commandOutput, timedOut } = await sshService.writeAndWait(
        sshSessionId,
        command
      );
      const executionTime = Date.now() - startTime;

      const formattedOutput = formatCommandOutput(commandOutput, command);
      const finalOutput = isOutputTooLong(formattedOutput)
        ? truncateOutput(formattedOutput, 100)
        : formattedOutput;

      const resultMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: timedOut
          ? (finalOutput || '命令执行超时') +
            '\n\n⚠️ 命令未在规定时间内完成，输出可能不完整'
          : finalOutput || '命令已执行完成（无输出）',
        timestamp: new Date(),
        type: 'command',
      };

      addMessage(activeConversation.id, resultMessage);

      await commandHistoryStore.addEntry({
        id: `hist-${Date.now()}`,
        timestamp: new Date(),
        deviceId: device.id,
        deviceName: device.name,
        userInput: messages.find(m => m.metadata?.command === command)?.content || '',
        parsedCommand: command,
        output: commandOutput || '(命令已执行，无输出)',
        exitCode: timedOut ? -1 : 0,
        executionTime: executionTime,
        isDangerous: false,
      });
    } catch (error) {
      console.error('执行命令出错:', error);

      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `执行命令时出错: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
      };

      if (activeConversation) {
        addMessage(activeConversation.id, errorMessage);
      }
    }
  };

  const clearConversation = () => {
    if (!activeConversation) return;

    Alert.alert('清除对话', '确定要清除所有对话记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: () => clearConversationStore(activeConversation.id),
      },
    ]);
  };

  const stopAgent = () => {
    if (agentExecutor.current) {
      agentExecutor.current.abort();
    }
  };

  return {
    inputText,
    setInputText,
    isProcessing,
    suggestions,
    showSuggestions,
    messages,
    sendMessage,
    executeCommand,
    clearConversation,
    stopAgent,
    selectSuggestion: (suggestion: Suggestion) => {
      setInputText(suggestion.command);
      setShowSuggestions(false);
    },
  };
};
