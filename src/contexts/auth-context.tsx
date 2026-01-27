'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService, { AuthState, LoginCredentials, RegisterData, AuthResponse, PendingSession } from '@/lib/auth-service'
import { User } from '@prisma/client'
import SessionPromptModal from '@/components/auth/SessionPromptModal'
import { getDefaultRedirectPath } from '@/lib/auth-redirect'

// Define the context type
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tabId: string | null
  needs2FASetupPrompt: boolean
  pendingSession: PendingSession | null
  showSessionPrompt: boolean
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<AuthResponse | void>
  register: (userData: RegisterData) => Promise<AuthResponse | void>
  verifyOTP: (otp: string, verificationToken: string) => Promise<AuthResponse | void>
  resendOTP: (verificationToken: string) => Promise<boolean>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  clearError: () => void
  refreshUser: () => Promise<void>
  dismiss2FAPrompt: () => Promise<void>
  acceptSession: () => Promise<void>
  declineSession: () => void
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
    pendingSession: null,
    showSessionPrompt: false,
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
          pendingSession: null,
          showSessionPrompt: false,
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

  // Accept pending session and authenticate
  const acceptSession = async () => {
    if (!authState.pendingSession) return

    setAuthState(prev => ({ ...prev, isLoading: true }))

    try {
      const newState = await authService.acceptPendingSession(authState.pendingSession)
      setAuthState(newState)

      // Clear guest mode flag if user accepts session
      sessionStorage.removeItem('guest_mode')

      // Redirect based on role if authenticated
      if (newState.isAuthenticated && newState.user) {
        const redirectPath = getDefaultRedirectPath(newState.user.role)
        window.location.href = redirectPath
      }
    } catch (error) {
      console.error('[Auth] Failed to accept session:', error)
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Không thể xác thực phiên đăng nhập',
        showSessionPrompt: false,
        pendingSession: null,
      }))
    }
  }

  // Decline session and browse as guest
  const declineSession = () => {
    // Set guest mode flag in sessionStorage (tab-specific)
    sessionStorage.setItem('guest_mode', 'true')

    // Redirect to homepage since user chose to browse as guest
    // This prevents the redirect loop when on admin pages
    const currentPath = window.location.pathname
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/contractor/dashboard')) {
      window.location.href = '/'
      return
    }

    setAuthState(prev => ({
      ...prev,
      pendingSession: null,
      showSessionPrompt: false,
    }))
  }

  // Context value
  const contextValue: AuthContextType = {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    tabId: authState.tabId,
    pendingSession: authState.pendingSession,
    showSessionPrompt: authState.showSessionPrompt,
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
    acceptSession,
    declineSession,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}

      {/* Session Prompt Modal for new tabs */}
      {authState.showSessionPrompt && authState.pendingSession && (
        <SessionPromptModal
          isOpen={authState.showSessionPrompt}
          userEmail={authState.pendingSession.user.email}
          userName={authState.pendingSession.user.name || 'Người dùng'}
          userRole={authState.pendingSession.user.role}
          onContinue={acceptSession}
          onBrowseAsGuest={declineSession}
          onClose={declineSession}
        />
      )}
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