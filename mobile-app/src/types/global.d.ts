/**
 * Global Type Declarations for Third-Party Modules
 * 第三方模块的全局类型声明
 */

// React Native MMKV
declare module 'react-native-mmkv' {
  export class MMKV {
    constructor(options?: {
      id?: string;
      path?: string;
      encryptionKey?: string;
    });
    
    set(key: string, value: string | number | boolean): void;
    getString(key: string): string | undefined;
    getNumber(key: string): number | undefined;
    getBoolean(key: string): boolean | undefined;
    contains(key: string): boolean;
    delete(key: string): void;
    getAllKeys(): string[];
    clearAll(): void;
  }
}

// Expo Speech
declare module 'expo-speech' {
  export interface SpeechOptions {
    language?: string;
    pitch?: number;
    rate?: number;
    onStart?: () => void;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (error: Error) => void;
  }
  
  export function speak(text: string, options?: SpeechOptions): void;
  export function stop(): Promise<void>;
  export function isSpeakingAsync(): Promise<boolean>;
  export function getAvailableVoicesAsync(): Promise<Voice[]>;
  
  export interface Voice {
    identifier: string;
    name: string;
    quality: string;
    language: string;
  }
}

// Expo Secure Store
declare module 'expo-secure-store' {
  export interface SecureStoreOptions {
    keychainService?: string;
    keychainAccessible?: number;
  }
  
  export function setItemAsync(
    key: string,
    value: string,
    options?: SecureStoreOptions
  ): Promise<void>;
  
  export function getItemAsync(
    key: string,
    options?: SecureStoreOptions
  ): Promise<string | null>;
  
  export function deleteItemAsync(
    key: string,
    options?: SecureStoreOptions
  ): Promise<void>;
}

// React Native Voice
declare module '@react-native-voice/voice' {
  export interface SpeechResultsEvent {
    value?: string[];
  }
  
  export interface SpeechErrorEvent {
    error?: {
      message?: string;
      code?: string;
    };
  }
  
  export interface SpeechStartEvent {
    error?: boolean;
  }
  
  export interface SpeechEndEvent {
    error?: boolean;
  }
  
  export default class Voice {
    static onSpeechStart: ((e: SpeechStartEvent) => void) | null;
    static onSpeechEnd: ((e: SpeechEndEvent) => void) | null;
    static onSpeechResults: ((e: SpeechResultsEvent) => void) | null;
    static onSpeechError: ((e: SpeechErrorEvent) => void) | null;
    static onSpeechPartialResults: ((e: SpeechResultsEvent) => void) | null;
    
    static start(locale: string): Promise<void>;
    static stop(): Promise<void>;
    static cancel(): Promise<void>;
    static destroy(): Promise<void>;
    static removeAllListeners(): void;
    static isAvailable(): Promise<boolean>;
    static isRecognizing(): Promise<boolean>;
  }
}
