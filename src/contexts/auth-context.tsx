'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService, { AuthState, LoginCredentials, RegisterData, AuthResponse } from '@/lib/auth-service'
import { User } from '@prisma/client'

// Define the context type
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tabId: string | null
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  clearError: () => void
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    tabId: null,
  })

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const state = await authService.initializeAuth()
        setAuthState(state)
      } catch (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Không thể khởi tạo xác thực',
          tabId: null,
        })
      }
    }

    initializeAuth()
  }, [])

  // Setup cross-tab communication for logout-all
  useEffect(() => {
    const cleanup = authService.setupCrossTabCommunication()
    return cleanup
  }, [])

  // NOTE: We intentionally DO NOT listen to storage events for cross-tab sync
  // This allows each tab to have its own independent session
  // Only 'logout-all' will affect other tabs via BroadcastChannel

  // Login function
  const login = async (credentials: LoginCredentials, rememberMe: boolean = true) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await authService.login(credentials, rememberMe)
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        tabId: authService.getTabId(),
      })
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Đăng nhập thất bại',
      }))
      throw error
    }
  }

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await authService.register(userData)
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        tabId: authService.getTabId(),
      })
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Đăng ký thất bại',
      }))
      throw error
    }
  }

  // Logout function (current tab only)
  const logout = async () => {
    await authService.logout()
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tabId: authService.getTabId(),
    })
  }

  // Logout all devices/tabs
  const logoutAll = async () => {
    await authService.logoutAll()
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tabId: authService.getTabId(),
    })
  }

  // Clear error function
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }))
  }

  // Context value
  const contextValue: AuthContextType = {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    tabId: authState.tabId,
    login,
    register,
    logout,
    logoutAll,
    clearError,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext