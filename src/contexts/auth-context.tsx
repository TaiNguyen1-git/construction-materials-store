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
  needs2FASetupPrompt: boolean
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<AuthResponse | void>
  register: (userData: RegisterData) => Promise<AuthResponse | void>
  verifyOTP: (otp: string, verificationToken: string) => Promise<AuthResponse | void>
  resendOTP: (verificationToken: string) => Promise<boolean>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  clearError: () => void
  refreshUser: () => Promise<void>
  dismiss2FAPrompt: () => Promise<void>
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
    needs2FASetupPrompt: false,
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
          needs2FASetupPrompt: false,
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

      if (response.twoFactorRequired) {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return response
      }

      setAuthState(prev => ({
        ...prev,
        user: response.user || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        tabId: authService.getTabId(),
        needs2FASetupPrompt: !!(response as any).needs2FASetupPrompt,
      }))
      return response
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

      if (response.verificationRequired) {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return response
      }

      setAuthState(prev => ({
        ...prev,
        user: response.user || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        tabId: authService.getTabId(),
      }))
      return response
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Đăng ký thất bại',
      }))
      throw error
    }
  }

  // Verify OTP function
  const verifyOTP = async (otp: string, verificationToken: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await authService.verifyOTP(otp, verificationToken)
      setAuthState(prev => ({
        ...prev,
        user: response.user || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        tabId: authService.getTabId(),
      }))
      return response
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Xác thực thất bại',
      }))
      throw error
    }
  }

  // Resend OTP function
  const resendOTP = async (verificationToken: string) => {
    return await authService.resendOTP(verificationToken)
  }

  // Logout function (current tab only)
  const logout = async () => {
    await authService.logout()
    setAuthState(prev => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tabId: authService.getTabId(),
    }))
  }

  // Logout all devices/tabs
  const logoutAll = async () => {
    await authService.logoutAll()
    setAuthState(prev => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tabId: authService.getTabId(),
    }))
  }

  // Clear error function
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }))
  }

  // Refresh user data function
  const refreshUser = async () => {
    try {
      const state = await authService.initializeAuth()
      setAuthState(state)
    } catch (error) {
      console.error('[Auth] Failed to refresh user:', error)
    }
  }

  // Dismiss 2FA onboarding prompt
  const dismiss2FAPrompt = async () => {
    try {
      const token = localStorage.getItem('access_token')
      await fetch('/api/auth/profile/dismiss-2fa-prompt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      authService.removeNeeds2FAPrompt()
      setAuthState(prev => ({ ...prev, needs2FASetupPrompt: false }))
    } catch (error) {
      console.error('Failed to dismiss 2FA prompt:', error)
    }
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
    verifyOTP,
    resendOTP,
    logout,
    logoutAll,
    clearError,
    refreshUser,
    dismiss2FAPrompt,
    needs2FASetupPrompt: authState.needs2FASetupPrompt,
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