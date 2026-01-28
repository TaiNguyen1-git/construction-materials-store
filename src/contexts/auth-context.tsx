'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getAuthHeaders } from '@/lib/api-client'
import authService, { AuthState, LoginCredentials, RegisterData, AuthResponse } from '@/lib/auth-service'
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
  pendingSessionUser: Partial<User> | null
  showSessionPrompt: boolean
  login: (credentials: LoginCredentials) => Promise<AuthResponse | void>
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
    pendingSessionUser: null,
    showSessionPrompt: false,
  })

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const state = await authService.initializeAuth()

        // Check if 2FA prompt was already dismissed in this session
        const isDismissedInSession = sessionStorage.getItem('dismissed_2fa_prompt') === 'true'

        setAuthState({
          ...state,
          needs2FASetupPrompt: state.needs2FASetupPrompt && !isDismissedInSession
        })
      } catch (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Không thể khởi tạo xác thực',
          tabId: null,
          needs2FASetupPrompt: false,
          pendingSessionUser: null,
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

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await authService.login(credentials)

      if (response.twoFactorRequired || response.verificationRequired) {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return response
      }

      const isDismissedInSession = sessionStorage.getItem('dismissed_2fa_prompt') === 'true'

      setAuthState(prev => ({
        ...prev,
        user: response.user || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        tabId: authService.getTabId(),
        needs2FASetupPrompt: !!response.needs2FASetupPrompt && !isDismissedInSession,
      }))
      return response
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }))
      throw error
    }
  }

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Đăng ký thất bại')

      if (data.verificationRequired) {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return data
      }

      setAuthState(prev => ({
        ...prev,
        user: data.user || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }))
      return data
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }))
      throw error
    }
  }

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
      setAuthState(prev => ({ ...prev, isLoading: false, error: error.message }))
      throw error
    }
  }

  const resendOTP = async (verificationToken: string) => {
    return await authService.resendOTP(verificationToken)
  }

  // Logout functions
  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    await authService.logout()
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tabId: authService.getTabId(),
      needs2FASetupPrompt: false,
      pendingSessionUser: null,
      showSessionPrompt: false,
    })
    window.location.href = '/'
  }

  const logoutAll = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    await authService.logoutAll()
  }

  const clearError = () => setAuthState(prev => ({ ...prev, error: null }))

  const refreshUser = async () => {
    const state = await authService.initializeAuth()
    setAuthState(state)
  }

  const dismiss2FAPrompt = async () => {
    try {
      // Call API to persist the dismissal in DB
      const response = await fetch('/api/auth/profile/dismiss-2fa-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders() // Include auth tokens
        }
      })

      if (response.ok) {
        setAuthState(prev => ({ ...prev, needs2FASetupPrompt: false }))
        // Also update local user hint if exists
        const userHint = localStorage.getItem('user_hint')
        if (userHint) {
          const user = JSON.parse(userHint)
          localStorage.setItem('user_hint', JSON.stringify({ ...user, hasSetTwoFactor: true }))
        }
      }
    } catch (error) {
      console.error('Failed to dismiss 2FA prompt in DB:', error)
      // Fallback: still dismiss in UI for the current session even if DB call fails
      setAuthState(prev => ({ ...prev, needs2FASetupPrompt: false }))
    }
  }

  // Accept pending session and authenticate
  const acceptSession = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }))

    // Clear guest mode hint
    authService.setGuestMode(false)
    localStorage.setItem('auth_active', 'true')

    // Re-initialize (this will trigger verify-session call which now uses HttpOnly cookies)
    const newState = await authService.initializeAuth()
    setAuthState(newState)

    // Redirect based on role if authenticated
    if (newState.isAuthenticated && newState.user) {
      const redirectPath = getDefaultRedirectPath(newState.user.role)
      window.location.href = redirectPath
    }
  }

  // Decline session and browse as guest
  const declineSession = () => {
    authService.setGuestMode(true)

    const currentPath = window.location.pathname
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/contractor/dashboard')) {
      window.location.href = '/'
      return
    }

    setAuthState(prev => ({
      ...prev,
      pendingSessionUser: null,
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
    needs2FASetupPrompt: authState.needs2FASetupPrompt,
    pendingSessionUser: authState.pendingSessionUser,
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
    acceptSession,
    declineSession,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}

      {/* Session Prompt Modal */}
      {authState.showSessionPrompt && authState.pendingSessionUser && (
        <SessionPromptModal
          isOpen={authState.showSessionPrompt}
          userEmail={authState.pendingSessionUser.email || ''}
          userName={authState.pendingSessionUser.name || 'Người dùng'}
          userRole={(authState.pendingSessionUser as any).role || 'CUSTOMER'}
          onContinue={acceptSession}
          onBrowseAsGuest={declineSession}
          onClose={declineSession}
        />
      )}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}