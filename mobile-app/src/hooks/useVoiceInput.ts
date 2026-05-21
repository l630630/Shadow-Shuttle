/**
 * 语音输入 Hook
 * 管理语音录制和识别
 */

import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { getVoiceInputModule } from '../services/voiceInputModule';

export const useVoiceInput = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSessionId, setRecordingSessionId] = useState<string | null>(null);
  
  // 延迟初始化语音模块以避免 NativeEventEmitter 警告
  const voiceModule = useRef<ReturnType<typeof getVoiceInputModule> | null>(null);

  const getVoiceModule = () => {
    if (!voiceModule.current) {
      voiceModule.current = getVoiceInputModule();
    }
    return voiceModule.current;
  };

  const startRecording = async (): Promise<void> => {
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

  const stopRecording = async (): Promise<string | null> => {
    if (!recordingSessionId) return null;

    try {
      const result = await getVoiceModule().stopRecording(recordingSessionId);
      setIsRecording(false);
      setRecordingSessionId(null);

      if (result.success && result.text) {
        return result.text;
      } else {
        Alert.alert(
          '识别失败',
          result.error || '无法识别语音',
          [{ text: '确定' }]
        );
        return null;
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setRecordingSessionId(null);
      return null;
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
};
