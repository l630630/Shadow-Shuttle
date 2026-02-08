/**
 * Conversation State Management
 * 对话状态管理
 * 
 * Manages conversation history using Zustand for AI chat interface.
 * Supports multiple conversations per device with context preservation.
 * 
 * 使用 Zustand 管理 AI 聊天界面的对话历史。
 * 支持每个设备的多个对话，并保持上下文。
 * 
 * Requirements: 8.6, 8.7
 */

import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import {
  Message,
  Conversation,
  CommandContext,
} from '../types/nlc';

/**
 * MMKV Storage Instance
 * MMKV 存储实例
 */
const storage = new MMKV({
  id: 'conversation-storage',
});

/**
 * Storage Keys
 * 存储键
 */
const STORAGE_KEYS = {
  CONVERSATIONS: 'conversations',
  ACTIVE_CONVERSATION_ID: 'active_conversation_id',
} as const;

/**
 * Conversation State Interface
 * 对话状态接口
 */
interface ConversationState {
  // State
  conversations: Map<string, Conversation>;
  activeConversationId: string | null;
  
  // Getters
  getActiveConversation: () => Conversation | null;
  getConversationById: (conversationId: string) => Conversation | null;
  getConversationsByDevice: (deviceId: string) => Conversation[];
  
  // Actions
  createConversation: (deviceId: string, context: CommandContext) => string;
  setActiveConversation: (conversationId: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  clearConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  
  // Persistence
  loadConversations: () => void;
  saveConversations: () => void;
}

/**
 * Load conversations from storage
 * 从存储加载对话
 */
const loadConversationsFromStorage = (): Map<string, Conversation> => {
  try {
    const stored = storage.getString(STORAGE_KEYS.CONVERSATIONS);
    
    if (!stored) {
      return new Map();
    }
    
    const parsed = JSON.parse(stored);
    const conversations = new Map<string, Conversation>();
    
    // Convert plain objects back to Map and Date objects
    for (const [id, conv] of Object.entries(parsed)) {
      const conversation = conv as any;
      
      conversations.set(id, {
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
        messages: conversation.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      });
    }
    
    return conversations;
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return new Map();
  }
};

/**
 * Save conversations to storage
 * 保存对话到存储
 */
const saveConversationsToStorage = (conversations: Map<string, Conversation>): void => {
  try {
    // Convert Map to plain object for JSON serialization
    const obj: Record<string, Conversation> = {};
    
    for (const [id, conv] of conversations.entries()) {
      obj[id] = conv;
    }
    
    storage.set(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(obj));
  } catch (error) {
    console.error('Failed to save conversations:', error);
  }
};

/**
 * Conversation Store
 * 对话存储
 * 
 * Requirements: 8.6, 8.7
 */
export const useConversationStore = create<ConversationState>((set, get) => ({
  // Initial state
  conversations: new Map(),
  activeConversationId: null,
  
  /**
   * Get active conversation
   * 获取活动对话
   * 
   * Requirement 8.6: Maintain conversation history
   * 
   * @returns Active conversation or null
   */
  getActiveConversation: () => {
    const { conversations, activeConversationId } = get();
    
    if (!activeConversationId) {
      return null;
    }
    
    return conversations.get(activeConversationId) || null;
  },
  
  /**
   * Get conversation by ID
   * 根据 ID 获取对话
   * 
   * @param conversationId Conversation ID
   * @returns Conversation or null
   */
  getConversationById: (conversationId: string) => {
    const { conversations } = get();
    return conversations.get(conversationId) || null;
  },
  
  /**
   * Get conversations by device
   * 根据设备获取对话
   * 
   * @param deviceId Device ID
   * @returns Array of conversations for the device
   */
  getConversationsByDevice: (deviceId: string) => {
    const { conversations } = get();
    const result: Conversation[] = [];
    
    for (const conv of conversations.values()) {
      if (conv.deviceId === deviceId) {
        result.push(conv);
      }
    }
    
    // Sort by updated time (most recent first)
    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },
  
  /**
   * Create new conversation
   * 创建新对话
   * 
   * Requirement 8.6: Support context-aware conversations
   * 
   * @param deviceId Device ID
   * @param context Command context
   * @returns Conversation ID
   */
  createConversation: (deviceId: string, context: CommandContext) => {
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation: Conversation = {
      id: conversationId,
      deviceId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      context,
    };
    
    set(state => {
      const newConversations = new Map(state.conversations);
      newConversations.set(conversationId, conversation);
      
      return {
        conversations: newConversations,
        activeConversationId: conversationId,
      };
    });
    
    // Save to storage
    get().saveConversations();
    
    console.log(`Created conversation: ${conversationId} for device: ${deviceId}`);
    
    return conversationId;
  },
  
  /**
   * Set active conversation
   * 设置活动对话
   * 
   * @param conversationId Conversation ID
   */
  setActiveConversation: (conversationId: string) => {
    const { conversations } = get();
    
    if (!conversations.has(conversationId)) {
      console.warn(`Conversation not found: ${conversationId}`);
      return;
    }
    
    set({ activeConversationId: conversationId });
    
    // Save active conversation ID
    storage.set(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, conversationId);
    
    console.log(`Set active conversation: ${conversationId}`);
  },
  
  /**
   * Add message to conversation
   * 向对话添加消息
   * 
   * Requirement 8.6: Append messages to conversation list
   * 
   * @param conversationId Conversation ID
   * @param message Message to add
   */
  addMessage: (conversationId: string, message: Message) => {
    set(state => {
      const conversation = state.conversations.get(conversationId);
      
      if (!conversation) {
        console.warn(`Conversation not found: ${conversationId}`);
        return state;
      }
      
      const updatedConversation: Conversation = {
        ...conversation,
        messages: [...conversation.messages, message],
        updatedAt: new Date(),
      };
      
      const newConversations = new Map(state.conversations);
      newConversations.set(conversationId, updatedConversation);
      
      return {
        conversations: newConversations,
      };
    });
    
    // Save to storage
    get().saveConversations();
    
    console.log(`Added message to conversation: ${conversationId}`);
  },
  
  /**
   * Update message in conversation
   * 更新对话中的消息
   * 
   * @param conversationId Conversation ID
   * @param messageId Message ID
   * @param updates Partial message updates
   */
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
    set(state => {
      const conversation = state.conversations.get(conversationId);
      
      if (!conversation) {
        console.warn(`Conversation not found: ${conversationId}`);
        return state;
      }
      
      const updatedMessages = conversation.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      
      const updatedConversation: Conversation = {
        ...conversation,
        messages: updatedMessages,
        updatedAt: new Date(),
      };
      
      const newConversations = new Map(state.conversations);
      newConversations.set(conversationId, updatedConversation);
      
      return {
        conversations: newConversations,
      };
    });
    
    // Save to storage
    get().saveConversations();
    
    console.log(`Updated message ${messageId} in conversation: ${conversationId}`);
  },
  
  /**
   * Clear conversation messages
   * 清除对话消息
   * 
   * Requirement 8.7: Support clearing conversation history
   * 
   * @param conversationId Conversation ID
   */
  clearConversation: (conversationId: string) => {
    set(state => {
      const conversation = state.conversations.get(conversationId);
      
      if (!conversation) {
        console.warn(`Conversation not found: ${conversationId}`);
        return state;
      }
      
      const clearedConversation: Conversation = {
        ...conversation,
        messages: [],
        updatedAt: new Date(),
      };
      
      const newConversations = new Map(state.conversations);
      newConversations.set(conversationId, clearedConversation);
      
      return {
        conversations: newConversations,
      };
    });
    
    // Save to storage
    get().saveConversations();
    
    console.log(`Cleared conversation: ${conversationId}`);
  },
  
  /**
   * Delete conversation
   * 删除对话
   * 
   * @param conversationId Conversation ID
   */
  deleteConversation: (conversationId: string) => {
    set(state => {
      const newConversations = new Map(state.conversations);
      newConversations.delete(conversationId);
      
      // If deleting active conversation, clear active ID
      const newActiveId = state.activeConversationId === conversationId
        ? null
        : state.activeConversationId;
      
      return {
        conversations: newConversations,
        activeConversationId: newActiveId,
      };
    });
    
    // Save to storage
    get().saveConversations();
    
    // Clear active conversation ID if needed
    if (get().activeConversationId === null) {
      storage.delete(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
    }
    
    console.log(`Deleted conversation: ${conversationId}`);
  },
  
  /**
   * Load conversations from storage
   * 从存储加载对话
   */
  loadConversations: () => {
    const conversations = loadConversationsFromStorage();
    const activeConversationId = storage.getString(STORAGE_KEYS.ACTIVE_CONVERSATION_ID) || null;
    
    set({
      conversations,
      activeConversationId,
    });
    
    console.log(`Loaded ${conversations.size} conversations from storage`);
  },
  
  /**
   * Save conversations to storage
   * 保存对话到存储
   */
  saveConversations: () => {
    const { conversations } = get();
    saveConversationsToStorage(conversations);
  },
}));

/**
 * Initialize conversation store
 * 初始化对话存储
 * 
 * Call this on app startup to load persisted conversations
 * 在应用启动时调用以加载持久化的对话
 */
export const initializeConversationStore = () => {
  useConversationStore.getState().loadConversations();
};

/**
 * Get conversation statistics
 * 获取对话统计
 * 
 * @returns Conversation statistics
 */
export const getConversationStats = () => {
  const { conversations } = useConversationStore.getState();
  
  let totalMessages = 0;
  let totalConversations = conversations.size;
  
  for (const conv of conversations.values()) {
    totalMessages += conv.messages.length;
  }
  
  return {
    totalConversations,
    totalMessages,
    averageMessagesPerConversation: totalConversations > 0 
      ? Math.round(totalMessages / totalConversations) 
      : 0,
  };
};

export default useConversationStore;
