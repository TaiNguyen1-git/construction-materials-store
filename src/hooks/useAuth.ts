import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User } from '../services/authService';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  // Check if user is authenticated on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const user = await authService.getCurrentUser();
      
      setAuthState({
        user,
        isAuthenticated: !!user,
        loading: false,
        error: null,
      });
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: (error as Error).message || 'Failed to check authentication status',
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { user } = await authService.login({ email, password });
      
      setAuthState({
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Login failed';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string, address?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { user } = await authService.register({ name, email, password, phone, address });
      
      setAuthState({
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Registration failed';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Logout failed';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // In a real app, you would call an API to update the user profile
      // For now, we'll just update the local state
      if (authState.user) {
        const updatedUser = { ...authState.user, ...updates };
        
        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
          loading: false,
          error: null,
        }));
        
        return { success: true, user: updatedUser };
      } else {
        throw new Error('No user found');
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to update profile';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus,
  };
};