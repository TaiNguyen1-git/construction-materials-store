/**
 * Enhanced Authentication Service with Multi-Tab Support
 * 
 * Features:
 * - Isolated tab sessions (each tab has its own session)
 * - Database-backed session management
 * - Token refresh mechanism
 * - "Logout all devices" support
 * - Rate limiting ready
 */

import { User } from '@prisma/client'

// ============ TYPES ============

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tabId: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  fullName: string
  email: string
  phone: string
  password: string
  guestId?: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken?: string
}

export interface AuthResponse {
  user: User
  tokens: TokenResponse
  sessionId?: string
}

export interface SessionInfo {
  id: string
  deviceInfo: string
  ipAddress: string
  lastActivityAt: Date
  createdAt: Date
  isCurrent: boolean
}

// ============ TAB ID MANAGEMENT ============

/**
 * Generate a unique tab ID for this browser tab
 * Uses sessionStorage so each tab gets its own ID
 */
function generateTabId(): string {
  if (typeof window === 'undefined') return ''

  let tabId = sessionStorage.getItem('tab_id')
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    sessionStorage.setItem('tab_id', tabId)
  }
  return tabId
}

/**
 * Get storage key with tab ID prefix for isolated storage
 */
function getTabStorageKey(key: string, tabId: string): string {
  return `${tabId}_${key}`
}

// ============ AUTHENTICATION SERVICE CLASS ============

class EnhancedAuthService {
  private static instance: EnhancedAuthService
  private accessToken: string | null = null
  private user: User | null = null
  private tabId: string = ''

  private constructor() {
    if (typeof window !== 'undefined') {
      this.tabId = generateTabId()
    }
  }

  static getInstance(): EnhancedAuthService {
    if (!EnhancedAuthService.instance) {
      EnhancedAuthService.instance = new EnhancedAuthService()
    }
    return EnhancedAuthService.instance
  }

  // ============ GETTERS ============

  getAccessToken(): string | null {
    return this.accessToken
  }

  getCurrentUser(): User | null {
    return this.user
  }

  getTabId(): string {
    return this.tabId
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user
  }

  // ============ STORAGE HELPERS ============

  /**
   * Get data from tab-specific sessionStorage
   */
  private getFromTabStorage(key: string): string | null {
    if (typeof window === 'undefined') return null

    // First try tab-specific storage
    const tabValue = sessionStorage.getItem(getTabStorageKey(key, this.tabId))
    if (tabValue) return tabValue

    // Fallback to shared localStorage (for backward compatibility)
    return localStorage.getItem(key)
  }

  /**
   * Set data in tab-specific sessionStorage
   */
  private setInTabStorage(key: string, value: string): void {
    if (typeof window === 'undefined') return

    // Store in tab-specific sessionStorage (primary)
    sessionStorage.setItem(getTabStorageKey(key, this.tabId), value)

    // Also store in localStorage for page reload persistence (shared)
    // This allows the same account to persist after page reload
    localStorage.setItem(key, value)

    // Store the last active tab ID
    localStorage.setItem('last_active_tab', this.tabId)
  }

  /**
   * Remove data from both storages
   */
  private removeFromTabStorage(key: string): void {
    if (typeof window === 'undefined') return

    // Remove from tab-specific storage
    sessionStorage.removeItem(getTabStorageKey(key, this.tabId))

    // Only remove from localStorage if this tab was the last active
    const lastActiveTab = localStorage.getItem('last_active_tab')
    if (lastActiveTab === this.tabId) {
      localStorage.removeItem(key)
    }
  }

  /**
   * Clear all auth data for this tab only
   */
  private clearTabStorage(): void {
    if (typeof window === 'undefined') return

    // Clear tab-specific data
    sessionStorage.removeItem(getTabStorageKey('access_token', this.tabId))
    sessionStorage.removeItem(getTabStorageKey('user', this.tabId))
    sessionStorage.removeItem(getTabStorageKey('session_id', this.tabId))

    // Only clear shared storage if this was the last active tab
    const lastActiveTab = localStorage.getItem('last_active_tab')
    if (lastActiveTab === this.tabId) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      localStorage.removeItem('session_id')
      localStorage.removeItem('remember_me')
    }
  }

  /**
   * Clear ALL auth data (for logout all devices)
   */
  private clearAllStorage(): void {
    if (typeof window === 'undefined') return

    // Clear both storages completely
    sessionStorage.clear()
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('session_id')
    localStorage.removeItem('remember_me')
    localStorage.removeItem('last_active_tab')
  }

  // ============ AUTH METHODS ============

  /**
   * Login user
   */
  async login(credentials: LoginCredentials, rememberMe: boolean = true): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tab-Id': this.tabId,
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Đăng nhập thất bại')
      }

      const data = await response.json()

      // Store tokens and user data
      this.accessToken = data.token
      this.user = data.user

      // Store in tab-specific storage
      this.setInTabStorage('access_token', data.token)
      this.setInTabStorage('user', JSON.stringify(data.user))

      if (data.sessionId) {
        this.setInTabStorage('session_id', data.sessionId)
      }

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true')
      }

      return {
        user: data.user,
        tokens: {
          accessToken: data.token,
        },
        sessionId: data.sessionId,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Register user
   */
  async register(userData: RegisterData, rememberMe: boolean = true): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tab-Id': this.tabId,
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Đăng ký thất bại')
      }

      const data = await response.json()

      // Store tokens and user data
      this.accessToken = data.token
      this.user = data.user

      // Store in tab-specific storage
      this.setInTabStorage('access_token', data.token)
      this.setInTabStorage('user', JSON.stringify(data.user))

      if (data.sessionId) {
        this.setInTabStorage('session_id', data.sessionId)
      }

      if (rememberMe) {
        localStorage.setItem('remember_me', 'true')
      }

      return {
        user: data.user,
        tokens: {
          accessToken: data.token,
        },
        sessionId: data.sessionId,
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Logout current tab only
   */
  async logout(): Promise<void> {
    const sessionId = this.getFromTabStorage('session_id')

    // Clear local state
    this.accessToken = null
    this.user = null

    // Clear tab-specific storage
    this.clearTabStorage()

    // Invalidate session on server
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tab-Id': this.tabId,
        },
        body: JSON.stringify({ sessionId }),
      })
    } catch (e) {
      console.error('[Auth] Failed to invalidate server session:', e)
    }
  }

  /**
   * Logout all devices/tabs
   */
  async logoutAll(): Promise<void> {
    // Clear local state
    this.accessToken = null
    this.user = null

    // Clear ALL storage
    this.clearAllStorage()

    // Invalidate all sessions on server
    try {
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
      })
    } catch (e) {
      console.error('[Auth] Failed to logout all sessions:', e)
    }

    // Notify other tabs via BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('auth_channel')
      channel.postMessage({ type: 'LOGOUT_ALL' })
      channel.close()
    }
  }

  /**
   * Initialize auth state from storage
   */
  async initializeAuth(): Promise<AuthState> {
    try {
      // Ensure we have a tab ID
      if (!this.tabId && typeof window !== 'undefined') {
        this.tabId = generateTabId()
      }

      const accessToken = this.getFromTabStorage('access_token')
      const userDataStr = this.getFromTabStorage('user')

      if (accessToken && userDataStr) {
        this.accessToken = accessToken
        this.user = JSON.parse(userDataStr)

        return {
          user: this.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          tabId: this.tabId,
        }
      }

      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        tabId: this.tabId,
      }
    } catch (error) {
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Không thể khởi tạo xác thực',
        tabId: this.tabId,
      }
    }
  }

  /**
   * Get list of active sessions for current user
   */
  async getActiveSessions(): Promise<SessionInfo[]> {
    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      return data.sessions
    } catch (error) {
      console.error('[Auth] Failed to get sessions:', error)
      return []
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error('[Auth] Failed to revoke session:', error)
      return false
    }
  }

  /**
   * Refresh access token (if implemented)
   */
  async refreshToken(): Promise<boolean> {
    // This is a placeholder - implement if needed
    return false
  }

  /**
   * Setup cross-tab communication for logout-all
   */
  setupCrossTabCommunication(): () => void {
    if (typeof BroadcastChannel === 'undefined') {
      return () => { }
    }

    const channel = new BroadcastChannel('auth_channel')

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LOGOUT_ALL') {
        this.accessToken = null
        this.user = null
        this.clearAllStorage()

        // Trigger page reload to update UI
        window.location.href = '/'
      }
    }

    channel.addEventListener('message', handleMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }
}

// Export singleton instance
export default EnhancedAuthService.getInstance()
