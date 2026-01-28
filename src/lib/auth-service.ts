/**
 * Enterprise-grade Authentication Service
 * 
 * Features:
 * - HttpOnly Cookie Based (XSS protection)
 * - Automatic Silent Token Refresh
 * - Session Revocation Support
 * - Cross-tab Guest Mode Sync
 * - Persistent Login Hints (without sensitive data)
 */

import { User } from '@prisma/client'

// ============ TYPES ============

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  tabId: string | null
  needs2FASetupPrompt: boolean
  showSessionPrompt: boolean
  pendingSessionUser: Partial<User> | null
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

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
  verificationRequired?: boolean
  twoFactorRequired?: boolean
  verificationToken?: string
  email?: string
  needs2FASetupPrompt?: boolean
}

// ============ HELPERS ============

function generateTabId(): string {
  if (typeof window === 'undefined') return ''
  let tabId = sessionStorage.getItem('tab_id')
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    sessionStorage.setItem('tab_id', tabId)
  }
  return tabId
}

// ============ AUTHENTICATION SERVICE CLASS ============

class EnhancedAuthService {
  private static instance: EnhancedAuthService
  private user: User | null = null
  private tabId: string = ''
  private isRefreshing: boolean = false
  private refreshSubscribers: ((token: string) => void)[] = []

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

  getCurrentUser(): User | null {
    return this.user
  }

  getTabId(): string {
    return this.tabId
  }

  // ============ GUEST MODE MANAGEMENT (Cross-tab) ============

  /**
   * Set guest mode with 1-day expiration in localStorage
   */
  setGuestMode(enabled: boolean): void {
    if (typeof window === 'undefined') return
    if (enabled) {
      const expiration = Date.now() + 24 * 60 * 60 * 1000 // 1 day
      localStorage.setItem('global_guest_mode', JSON.stringify({ enabled: true, expires: expiration }))
      sessionStorage.setItem('tab_guest_mode', 'true')
    } else {
      localStorage.removeItem('global_guest_mode')
      sessionStorage.removeItem('tab_guest_mode')
    }
  }

  isGuestMode(): boolean {
    if (typeof window === 'undefined') return false

    // Check tab-specific first (most reliable)
    if (sessionStorage.getItem('tab_guest_mode') === 'true') return true

    // Check global hint
    const globalGuest = localStorage.getItem('global_guest_mode')
    if (globalGuest) {
      try {
        const { enabled, expires } = JSON.parse(globalGuest)
        if (enabled && expires > Date.now()) return true
        // Expired
        localStorage.removeItem('global_guest_mode')
      } catch (e) {
        localStorage.removeItem('global_guest_mode')
      }
    }
    return false
  }

  // ============ AUTH METHODS ============

  /**
   * Initialize auth state
   * Reads from server instead of local storage for security
   */
  async initializeAuth(): Promise<AuthState> {
    try {
      if (!this.tabId && typeof window !== 'undefined') {
        this.tabId = generateTabId()
      }

      // 1. Check if user is in guest mode
      if (this.isGuestMode()) {
        return this.getLoggedOutState()
      }

      // 2. See if we have a login hint (to avoid unnecessary API calls for fresh guests)
      const hasLoginHint = localStorage.getItem('auth_active') === 'true'
      if (!hasLoginHint) {
        return this.getLoggedOutState()
      }

      // 3. Verify with server (this uses HttpOnly cookies)
      const verifyRes = await fetch('/api/auth/verify-session', {
        method: 'POST',
        headers: { 'X-Tab-Id': this.tabId }
      })

      if (verifyRes.ok) {
        const data = await verifyRes.json()
        this.user = data.user
        return {
          user: this.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          tabId: this.tabId,
          needs2FASetupPrompt: false,
          showSessionPrompt: false,
          pendingSessionUser: null
        }
      }

      // 4. Try Refresh if 401
      if (verifyRes.status === 401) {
        const refreshed = await this.refreshToken()
        if (refreshed) return this.initializeAuth()
      }

      // 5. If verify failed but localStorage has shared user, show prompt
      const sharedUserData = localStorage.getItem('user_hint')
      if (sharedUserData) {
        try {
          const sharedUser = JSON.parse(sharedUserData)
          return {
            ...this.getLoggedOutState(),
            showSessionPrompt: true,
            pendingSessionUser: sharedUser
          }
        } catch (e) { }
      }

      return this.getLoggedOutState()
    } catch (error) {
      return {
        ...this.getLoggedOutState(),
        error: 'Lỗi khởi tạo xác thực'
      }
    }
  }

  private getLoggedOutState(): AuthState {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tabId: this.tabId,
      needs2FASetupPrompt: false,
      showSessionPrompt: false,
      pendingSessionUser: null
    }
  }

  /**
   * Refresh Token logic (Silent Refresh)
   */
  async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.refreshSubscribers.push(token => resolve(!!token))
      })
    }

    this.isRefreshing = true
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        this.user = data.user
        localStorage.setItem('auth_active', 'true')
        localStorage.setItem('user_hint', JSON.stringify({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role
        }))
        this.onTokenRefreshed('success')
        return true
      }
      this.logoutLocally()
      this.onTokenRefreshed('')
      return false
    } catch (e) {
      this.onTokenRefreshed('')
      return false
    } finally {
      this.isRefreshing = false
    }
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.map(cb => cb(token))
    this.refreshSubscribers = []
  }

  /**
   * Login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tab-Id': this.tabId },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()
    if (response.ok && data.user) {
      this.handleAuthSuccess(data.user)
    }
    return data
  }

  /**
   * Verify OTP
   */
  async verifyOTP(otp: string, verificationToken: string): Promise<AuthResponse> {
    const response = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Tab-Id': this.tabId },
      body: JSON.stringify({ otp, verificationToken }),
    })

    const data = await response.json()
    if (response.ok && data.user) {
      this.handleAuthSuccess(data.user)
    }
    return data
  }

  /**
   * Resend OTP
   */
  async resendOTP(verificationToken: string): Promise<boolean> {
    const response = await fetch('/api/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationToken }),
    })
    return response.ok
  }

  private handleAuthSuccess(user: User) {
    this.user = user
    this.setGuestMode(false)
    localStorage.setItem('auth_active', 'true')
    localStorage.setItem('user_hint', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }))

    // Clear legacy auth data to avoid conflicts
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    this.logoutLocally()
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) { }
  }

  private logoutLocally() {
    this.user = null
    localStorage.removeItem('auth_active')
    localStorage.removeItem('user_hint')
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    sessionStorage.removeItem('tab_guest_mode')
    // Don't clear global_guest_mode as user might want to continue as guest
  }

  async logoutAll(): Promise<void> {
    this.logoutLocally()
    localStorage.removeItem('global_guest_mode')
    try {
      await fetch('/api/auth/logout-all', { method: 'POST' })
    } catch (e) { }

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('auth_channel')
      channel.postMessage({ type: 'LOGOUT_ALL' })
      channel.close()
    }
    window.location.href = '/'
  }

  /**
   * Cross-tab sync for logout
   */
  setupCrossTabCommunication(): () => void {
    if (typeof BroadcastChannel === 'undefined') return () => { }
    const channel = new BroadcastChannel('auth_channel')
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LOGOUT_ALL') {
        this.logoutLocally()
        window.location.reload()
      }
    }
    channel.addEventListener('message', handleMessage)
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }
}

export default EnhancedAuthService.getInstance()
