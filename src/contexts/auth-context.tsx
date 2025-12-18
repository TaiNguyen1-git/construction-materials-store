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
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
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
    error: null
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
          error: 'Failed to initialize authentication'
        })
      }
    }

    initializeAuth()
  }, [])

  // Listen for storage changes from other tabs (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Only handle changes to auth-related keys
      if (event.key === 'user' || event.key === 'access_token') {
        console.log('[Auth Context] Storage change detected from another tab:', event.key)

        if (event.key === 'user') {
          if (event.newValue) {
            // User logged in from another tab
            try {
              const user = JSON.parse(event.newValue)
              console.log('[Auth Context] User logged in from another tab:', user.email, 'role:', user.role)

              setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null
              })

              // Redirect based on role
              if (user.role === 'MANAGER' || user.role === 'EMPLOYEE') {
                console.log('[Auth Context] Redirecting to /admin after cross-tab login')
                window.location.href = '/admin'
              } else {
                // For customers, refresh to update the UI
                console.log('[Auth Context] Refreshing page after cross-tab customer login')
                window.location.reload()
              }
            } catch (e) {
              console.error('[Auth Context] Error parsing user data from storage:', e)
            }
          } else {
            // User logged out from another tab
            console.log('[Auth Context] User logged out from another tab, clearing state')
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            })

            // Redirect to home page
            window.location.href = '/'
          }
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [])

  // Login function
  const login = async (credentials: LoginCredentials, rememberMe: boolean = true) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await authService.login(credentials, rememberMe)
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed'
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
        error: null
      })
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed'
      }))
      throw error
    }
  }

  // Logout function
  const logout = async () => {
    await authService.logout()
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
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
    login,
    register,
    logout,
    clearError
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