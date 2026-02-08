/**
 * Voice Input Module
 * 语音输入模块
 * 
 * Handles voice recording and speech recognition for natural language input.
 * Supports both Chinese and English speech recognition.
 * 
 * 处理语音录制和语音识别，用于自然语言输入。
 * 支持中文和英文语音识别。
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 */

import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
  SpeechStartEvent,
  SpeechEndEvent,
} from '@react-native-voice/voice';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import {
  VoiceRecognitionResult,
  RecordingStatus,
} from '../types/nlc';

/**
 * Voice Input Module Interface
 * 语音输入模块接口
 */
export interface IVoiceInputModule {
  /**
   * Start recording
   * 开始录音
   * 
   * @returns Recording session ID
   */
  startRecording(): Promise<string>;

  /**
   * Stop recording and recognize speech
   * 停止录音并识别
   * 
   * @param sessionId Recording session ID
   * @returns Recognition result
   */
  stopRecording(sessionId: string): Promise<VoiceRecognitionResult>;

  /**
   * Cancel recording
   * 取消录音
   * 
   * @param sessionId Recording session ID
   */
  cancelRecording(sessionId: string): void;

  /**
   * Check microphone permission
   * 检查麦克风权限
   * 
   * @returns Whether permission is granted
   */
  checkPermission(): Promise<boolean>;

  /**
   * Request microphone permission
   * 请求麦克风权限
   * 
   * @returns Whether permission was granted
   */
  requestPermission(): Promise<boolean>;

  /**
   * Get recording status
   * 获取录音状态
   * 
   * @param sessionId Recording session ID
   * @returns Recording status
   */
  getRecordingStatus(sessionId: string): RecordingStatus;

  /**
   * Set recognition language
   * 设置识别语言
   * 
   * @param language Language code ('zh' or 'en')
   */
  setLanguage(language: 'zh' | 'en'): void;
}

/**
 * Recording Session
 * 录音会话
 */
interface RecordingSession {
  id: string;
  startTime: number;
  isRecording: boolean;
  results: string[];
  error?: Error;
}

/**
 * Voice Input Module Implementation
 * 语音输入模块实现
 */
export class VoiceInputModule implements IVoiceInputModule {
  private sessions: Map<string, RecordingSession> = new Map();
  private currentSessionId: string | null = null;
  private language: 'zh' | 'en' = 'zh';
  private isInitialized: boolean = false;

  constructor() {
    // Delay initialization to avoid NativeEventEmitter warning
    // 延迟初始化以避免 NativeEventEmitter 警告
    setTimeout(() => {
      this.initializeVoice();
    }, 100);
  }

  /**
   * Initialize Voice recognition
   * 初始化语音识别
   */
  private async initializeVoice(): Promise<void> {
    try {
      // Check if Voice module is available
      if (!Voice) {
        console.warn('Voice module not available');
        this.isInitialized = false;
        return;
      }

      // Set up event listeners with proper null checks
      Voice.onSpeechStart = this.onSpeechStart.bind(this);
      Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
      Voice.onSpeechResults = this.onSpeechResults.bind(this);
      Voice.onSpeechError = this.onSpeechError.bind(this);

      this.isInitialized = true;
      console.log('Voice recognition initialized');
    } catch (error) {
      console.error('Failed to initialize voice recognition:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Handle speech start event
   * 处理语音开始事件
   */
  private onSpeechStart(event: SpeechStartEvent): void {
    console.log('Speech started');
    if (this.currentSessionId) {
      const session = this.sessions.get(this.currentSessionId);
      if (session) {
        session.isRecording = true;
      }
    }
  }

  /**
   * Handle speech end event
   * 处理语音结束事件
   */
  private onSpeechEnd(event: SpeechEndEvent): void {
    console.log('Speech ended');
    if (this.currentSessionId) {
      const session = this.sessions.get(this.currentSessionId);
      if (session) {
        session.isRecording = false;
      }
    }
  }

  /**
   * Handle speech results
   * 处理语音识别结果
   */
  private onSpeechResults(event: SpeechResultsEvent): void {
    console.log('Speech results:', event.value);
    if (this.currentSessionId && event.value) {
      const session = this.sessions.get(this.currentSessionId);
      if (session) {
        session.results = event.value;
      }
    }
  }

  /**
   * Handle speech error
   * 处理语音识别错误
   */
  private onSpeechError(event: SpeechErrorEvent): void {
    console.error('Speech error:', event.error);
    if (this.currentSessionId) {
      const session = this.sessions.get(this.currentSessionId);
      if (session) {
        session.error = new Error(event.error?.message || 'Speech recognition error');
        session.isRecording = false;
      }
    }
  }

  /**
   * Set recognition language
   * 设置识别语言
   * 
   * Requirement 2.6: Support Chinese and English speech recognition
   * 
   * @param language Language code ('zh' or 'en')
   */
  setLanguage(language: 'zh' | 'en'): void {
    this.language = language;
    console.log(`Voice recognition language set to: ${language}`);
  }

  /**
   * Check microphone permission
   * 检查麦克风权限
   * 
   * Requirement 2.4: Check microphone permission
   * 
   * @returns Whether permission is granted
   */
  async checkPermission(): Promise<boolean> {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.MICROPHONE,
        android: PERMISSIONS.ANDROID.RECORD_AUDIO,
        default: PERMISSIONS.ANDROID.RECORD_AUDIO,
      });

      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return false;
    }
  }

  /**
   * Request microphone permission
   * 请求麦克风权限
   * 
   * Requirement 2.4: Request microphone permission
   * 
   * @returns Whether permission was granted
   */
  async requestPermission(): Promise<boolean> {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.MICROPHONE,
        android: PERMISSIONS.ANDROID.RECORD_AUDIO,
        default: PERMISSIONS.ANDROID.RECORD_AUDIO,
      });

      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  }

  /**
   * Start recording
   * 开始录音
   * 
   * Requirements: 2.1, 2.2
   * 
   * @returns Recording session ID
   * @throws Error if permission is not granted or initialization failed
   */
  async startRecording(): Promise<string> {
    // Check if voice recognition is initialized
    if (!this.isInitialized) {
      throw new Error('Voice recognition not initialized');
    }

    // Check permission
    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Microphone permission not granted');
      }
    }

    // Stop any existing recording
    if (this.currentSessionId) {
      try {
        await Voice.stop();
      } catch (error) {
        console.warn('Error stopping previous recording:', error);
      }
    }

    // Create new session
    const sessionId = `voice-${Date.now()}`;
    const session: RecordingSession = {
      id: sessionId,
      startTime: Date.now(),
      isRecording: false, // Will be set to true in onSpeechStart
      results: [],
    };

    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;

    try {
      // Determine locale based on language setting
      const locale = this.language === 'zh' ? 'zh-CN' : 'en-US';

      // Start voice recognition
      await Voice.start(locale);

      console.log(`Recording started with session ID: ${sessionId}`);
      return sessionId;
    } catch (error) {
      // Clean up on error
      this.sessions.delete(sessionId);
      this.currentSessionId = null;

      throw new Error(
        error instanceof Error 
          ? `Failed to start recording: ${error.message}`
          : 'Failed to start recording'
      );
    }
  }

  /**
   * Stop recording and recognize speech
   * 停止录音并识别
   * 
   * Requirements: 2.2, 2.3
   * 
   * @param sessionId Recording session ID
   * @returns Recognition result
   * @throws Error if session not found or recognition failed
   */
  async stopRecording(sessionId: string): Promise<VoiceRecognitionResult> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Recording session not found: ${sessionId}`);
    }

    try {
      // Stop voice recognition
      await Voice.stop();

      // Wait a bit for results to be processed
      await new Promise(resolve => setTimeout(resolve, 300));

      // Calculate duration
      const duration = Date.now() - session.startTime;

      // Check for errors
      if (session.error) {
        return {
          success: false,
          confidence: 0,
          language: this.language,
          duration,
          error: session.error.message,
        };
      }

      // Check if we have results
      if (session.results.length === 0) {
        return {
          success: false,
          confidence: 0,
          language: this.language,
          duration,
          error: 'No speech detected',
        };
      }

      // Get the best result (first one is usually the most confident)
      const text = session.results[0];

      // Clean up session
      this.sessions.delete(sessionId);
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }

      // Return success result
      return {
        success: true,
        text,
        confidence: 0.9, // Voice library doesn't provide confidence, use default
        language: this.language,
        duration,
      };
    } catch (error) {
      // Clean up session
      this.sessions.delete(sessionId);
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }

      return {
        success: false,
        confidence: 0,
        language: this.language,
        duration: Date.now() - session.startTime,
        error: error instanceof Error 
          ? error.message 
          : 'Failed to stop recording',
      };
    }
  }

  /**
   * Cancel recording
   * 取消录音
   * 
   * Requirement 2.2: Cancel recording
   * 
   * @param sessionId Recording session ID
   */
  cancelRecording(sessionId: string): void {
    const session = this.sessions.get(sessionId);

    if (!session) {
      console.warn(`Recording session not found: ${sessionId}`);
      return;
    }

    try {
      // Cancel voice recognition
      Voice.cancel();

      // Clean up session
      this.sessions.delete(sessionId);
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }

      console.log(`Recording cancelled: ${sessionId}`);
    } catch (error) {
      console.error('Error cancelling recording:', error);
    }
  }

  /**
   * Get recording status
   * 获取录音状态
   * 
   * @param sessionId Recording session ID
   * @returns Recording status
   */
  getRecordingStatus(sessionId: string): RecordingStatus {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        isRecording: false,
        duration: 0,
        audioLevel: 0,
      };
    }

    const duration = Date.now() - session.startTime;

    return {
      isRecording: session.isRecording,
      duration,
      audioLevel: 0, // Voice library doesn't provide audio level
    };
  }

  /**
   * Destroy voice recognition
   * 销毁语音识别
   * 
   * Clean up resources when module is no longer needed
   * 当模块不再需要时清理资源
   */
  async destroy(): Promise<void> {
    try {
      // Stop any active recording
      if (this.currentSessionId) {
        await Voice.stop();
      }

      // Remove event listeners
      Voice.removeAllListeners();

      // Clear sessions
      this.sessions.clear();
      this.currentSessionId = null;
      this.isInitialized = false;

      console.log('Voice recognition destroyed');
    } catch (error) {
      console.error('Error destroying voice recognition:', error);
    }
  }
}

/**
 * Singleton instance
 * 单例实例
 */
let voiceInputModuleInstance: VoiceInputModule | null = null;

/**
 * Get VoiceInputModule singleton instance
 * 获取语音输入模块单例实例
 * 
 * @returns VoiceInputModule instance
 */
export function getVoiceInputModule(): VoiceInputModule {
  if (!voiceInputModuleInstance) {
    voiceInputModuleInstance = new VoiceInputModule();
  }
  return voiceInputModuleInstance;
}

/**
 * Reset VoiceInputModule singleton (for testing)
 * 重置语音输入模块单例（用于测试）
 */
export function resetVoiceInputModule(): void {
  if (voiceInputModuleInstance) {
    voiceInputModuleInstance.destroy();
  }
  voiceInputModuleInstance = null;
}

export default VoiceInputModule;
