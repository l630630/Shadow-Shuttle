/**
 * Authentication State Management
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = '@shadow_shuttle_auth';

interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  email: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadAuthState: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  username: null,
  email: null,
  loading: false,
  error: null,
  
  loadAuthState: async () => {
    set({ loading: true, error: null });
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const authData = JSON.parse(stored);
        set({ 
          isLoggedIn: authData.isLoggedIn,
          username: authData.username,
          email: authData.email,
          loading: false 
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load auth state';
      set({ error: errorMessage, loading: false });
    }
  },
  
  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      // TODO: Implement actual authentication with backend
      // For now, accept any non-empty credentials
      if (!username.trim() || !password.trim()) {
        throw new Error('用户名和密码不能为空');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const authData = {
        isLoggedIn: true,
        username,
        email: `${username}@shadowshuttle.com`,
      };
      
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      set({ ...authData, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  register: async (username: string, email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      // TODO: Implement actual registration with backend
      // For now, accept any non-empty credentials
      if (!username.trim() || !email.trim() || !password.trim()) {
        throw new Error('所有字段都必须填写');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('邮箱格式不正确');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const authData = {
        isLoggedIn: true,
        username,
        email,
      };
      
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      set({ ...authData, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  
  logout: async () => {
    set({ loading: true, error: null });
    try {
      // Clear auth state from storage
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      
      // Reset state
      set({ 
        isLoggedIn: false,
        username: null,
        email: null,
        loading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));
