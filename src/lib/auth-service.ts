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

export interface PendingSession {
  accessToken: string
  user: User
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tabId: string | null
  needs2FASetupPrompt: boolean
  pendingSession: PendingSession | null
  showSessionPrompt: boolean
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
  user?: User
  tokens?: TokenResponse
  sessionId?: string
  verificationRequired?: boolean
  twoFactorRequired?: boolean
  verificationToken?: string
  email?: string
  needs2FASetupPrompt?: boolean
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
    localStorage.removeItem('session_prompt_preference')
  }

  /**
   * Clear 2FA prompt flag
   */
  removeNeeds2FAPrompt(): void {
    sessionStorage.removeItem(getTabStorageKey('needs_2fa_prompt', this.tabId))
    localStorage.removeItem('needs_2fa_prompt')
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

      // If 2FA or verification is required, don't store tokens yet
      if (data.twoFactorRequired || data.verificationRequired) {
        return data
      }

      // Store tokens and user data
      this.accessToken = data.token
      this.user = data.user

      // Clear guest mode flag since user is now logged in
      sessionStorage.removeItem('guest_mode')

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

      if (data.needs2FASetupPrompt) {
        this.setInTabStorage('needs_2fa_prompt', 'true')
      }

      return {
        user: data.user,
        tokens: {
          accessToken: data.token,
        },
        sessionId: data.sessionId,
        needs2FASetupPrompt: !!data.needs2FASetupPrompt,
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

      // If verification is required, don't store tokens yet
      if (data.verificationRequired || data.twoFactorRequired) {
        return data
      }

      // Store tokens and user data
      this.accessToken = data.token
      this.user = data.user

      // Clear guest mode flag since user is now logged in
      sessionStorage.removeItem('guest_mode')

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
   * New flow: Check if this is a new tab and whether to prompt user
   */
  async initializeAuth(): Promise<AuthState> {
    try {
      // Ensure we have a tab ID
      if (!this.tabId && typeof window !== 'undefined') {
        this.tabId = generateTabId()
      }

      // Check tab-specific storage first (this tab's own session)
      const tabAccessToken = sessionStorage.getItem(getTabStorageKey('access_token', this.tabId))
      const tabUserDataStr = sessionStorage.getItem(getTabStorageKey('user', this.tabId))

      // If this tab has its own session, use it directly
      if (tabAccessToken && tabUserDataStr) {
        this.accessToken = tabAccessToken
        this.user = JSON.parse(tabUserDataStr)

        return {
          user: this.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          tabId: this.tabId,
          needs2FASetupPrompt: this.getFromTabStorage('needs_2fa_prompt') === 'true',
          pendingSession: null,
          showSessionPrompt: false,
        }
      }

      // Check if this tab is in guest mode (user previously chose to browse as guest)
      const isGuestMode = sessionStorage.getItem('guest_mode') === 'true'
      if (isGuestMode) {
        return {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          tabId: this.tabId,
          needs2FASetupPrompt: false,
          pendingSession: null,
          showSessionPrompt: false,
        }
      }

      // Check shared localStorage for existing session from other tabs
      const sharedAccessToken = localStorage.getItem('access_token')
      const sharedUserDataStr = localStorage.getItem('user')

      if (sharedAccessToken && sharedUserDataStr) {
        const sharedUser = JSON.parse(sharedUserDataStr) as User

        // Check if user has a saved preference
        const preference = localStorage.getItem('session_prompt_preference')

        if (preference === 'guest') {
          // User previously chose to always browse as guest
          return {
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            tabId: this.tabId,
            needs2FASetupPrompt: false,
            pendingSession: null,
            showSessionPrompt: false,
          }
        }

        if (preference === 'continue') {
          // User previously chose to always continue - verify and use session
          const isValid = await this.verifySessionWithServer(sharedAccessToken)
          if (isValid) {
            this.accessToken = sharedAccessToken
            this.user = sharedUser
            this.setInTabStorage('access_token', sharedAccessToken)
            this.setInTabStorage('user', sharedUserDataStr)
            return {
              user: this.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              tabId: this.tabId,
              needs2FASetupPrompt: false,
              pendingSession: null,
              showSessionPrompt: false,
            }
          }
          // Token invalid, clear and continue as guest
          this.clearSharedStorage()
        }

        // No preference - show the prompt to let user decide
        return {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          tabId: this.tabId,
          needs2FASetupPrompt: false,
          pendingSession: {
            accessToken: sharedAccessToken,
            user: sharedUser,
          },
          showSessionPrompt: true,
        }
      }

      // No session found anywhere
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        tabId: this.tabId,
        needs2FASetupPrompt: false,
        pendingSession: null,
        showSessionPrompt: false,
      }
    } catch (error) {
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Không thể khởi tạo xác thực',
        tabId: this.tabId,
        needs2FASetupPrompt: false,
        pendingSession: null,
        showSessionPrompt: false,
      }
    }
  }

  /**
   * Verify session with server
   */
  async verifySessionWithServer(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      })

      if (!response.ok) return false

      const data = await response.json()
      return data.valid === true
    } catch (error) {
      console.error('[Auth] Failed to verify session:', error)
      return false
    }
  }

  /**
   * Accept pending session and authenticate this tab
   */
  async acceptPendingSession(pendingSession: PendingSession): Promise<AuthState> {
    const isValid = await this.verifySessionWithServer(pendingSession.accessToken)

    if (!isValid) {
      // Token is no longer valid
      this.clearSharedStorage()
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        tabId: this.tabId,
        needs2FASetupPrompt: false,
        pendingSession: null,
        showSessionPrompt: false,
      }
    }

    // Session is valid - use it for this tab
    this.accessToken = pendingSession.accessToken
    this.user = pendingSession.user

    // Store in tab-specific storage
    this.setInTabStorage('access_token', pendingSession.accessToken)
    this.setInTabStorage('user', JSON.stringify(pendingSession.user))

    return {
      user: this.user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      tabId: this.tabId,
      needs2FASetupPrompt: false,
      pendingSession: null,
      showSessionPrompt: false,
    }
  }

  /**
   * Clear shared localStorage (used when session is invalid)
   */
  private clearSharedStorage(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('session_id')
    localStorage.removeItem('remember_me')
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

  /**
   * Verify OTP for email verification or 2FA
   */
  async verifyOTP(otp: string, verificationToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tab-Id': this.tabId,
        },
        body: JSON.stringify({ otp, verificationToken }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Xác thực thất bại')
      }

      const data = await response.json()

      // Store tokens and user data
      this.accessToken = data.token
      this.user = data.user

      // Clear guest mode flag since user is now logged in
      sessionStorage.removeItem('guest_mode')

      // Store in tab-specific storage
      this.setInTabStorage('access_token', data.token)
      this.setInTabStorage('user', JSON.stringify(data.user))

      if (data.sessionId) {
        this.setInTabStorage('session_id', data.sessionId)
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
   * Resend OTP
   */
  async resendOTP(verificationToken: string): Promise<boolean> {
    try {
      const response = await fetch('/api/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verificationToken }),
      })

      return response.ok
    } catch (error) {
      console.error('[Auth] Failed to resend OTP:', error)
      return false
    }
  }
}

// Export singleton instance
export default EnhancedAuthService.getInstance()
