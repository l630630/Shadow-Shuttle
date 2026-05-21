/**
 * Message Actions Hook
 * 消息操作 Hook
 * 
 * Manages message-related actions like executing commands, canceling, and stopping agents.
 * 管理消息相关操作，如执行命令、取消和停止代理。
 */

import { useCallback } from 'react';

/**
 * Message Actions Hook Props
 */
interface UseMessageActionsProps {
  onExecuteCommand?: (command: string, messageId: string) => void;
  onCancelCommand?: (messageId: string) => void;
  onAgentStop?: (messageId: string) => void;
}

/**
 * Message Actions Hook Return Type
 */
export interface UseMessageActionsReturn {
  handleExecuteCommand: (command: string, messageId: string) => void;
  handleCancelCommand: (messageId: string) => void;
  handleAgentStop: (messageId: string) => void;
}

/**
 * Message Actions Hook
 * 消息操作 Hook
 * 
 * @param props - Hook props
 * @returns Message action handlers
 */
export const useMessageActions = ({
  onExecuteCommand,
  onCancelCommand,
  onAgentStop,
}: UseMessageActionsProps): UseMessageActionsReturn => {
  /**
   * Handle execute command
   * 处理执行命令
   */
  const handleExecuteCommand = useCallback(
    (command: string, messageId: string) => {
      onExecuteCommand?.(command, messageId);
    },
    [onExecuteCommand]
  );

  /**
   * Handle cancel command
   * 处理取消命令
   */
  const handleCancelCommand = useCallback(
    (messageId: string) => {
      onCancelCommand?.(messageId);
    },
    [onCancelCommand]
  );

  /**
   * Handle agent stop
   * 处理停止代理
   */
  const handleAgentStop = useCallback(
    (messageId: string) => {
      onAgentStop?.(messageId);
    },
    [onAgentStop]
  );

  return {
    handleExecuteCommand,
    handleCancelCommand,
    handleAgentStop,
  };
};
