import { User } from '@prisma/client'

// Define the structure for authentication state
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Define the structure for login credentials
export interface LoginCredentials {
  email: string
  password: string
}

// Define the structure for registration data
export interface RegisterData {
  fullName: string
  email: string
  phone: string
  password: string
  guestId?: string // Optional: for migrating guest data
}

// Define the structure for token response
export interface TokenResponse {
  accessToken: string
  refreshToken: string
}

// Define the structure for authentication response
export interface AuthResponse {
  user: User
  tokens: TokenResponse
}

class AuthenticationService {
  private static instance: AuthenticationService
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private user: User | null = null
  private rememberMe: boolean = true // Default to true for backward compatibility

  private constructor() { }

  static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService()
    }
    return AuthenticationService.instance
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken
  }

  // Get current refresh token
  getRefreshToken(): string | null {
    return this.refreshToken
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user
  }

  // Set remember me preference
  setRememberMe(remember: boolean): void {
    this.rememberMe = remember
  }

  // Get the appropriate storage based on remember me setting
  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null
    // Check if there's an existing preference stored
    const storedPref = localStorage.getItem('remember_me')
    if (storedPref !== null) {
      this.rememberMe = storedPref === 'true'
    }
    return this.rememberMe ? localStorage : sessionStorage
  }

  // Login user
  async login(credentials: LoginCredentials, rememberMe: boolean = true): Promise<AuthResponse> {
    try {
      // Set remember me preference before storing
      this.rememberMe = rememberMe

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()

      // Store tokens and user data
      this.accessToken = data.token
      this.user = data.user

      // Store remember me preference in localStorage (always persist this)
      if (typeof window !== 'undefined') {
        localStorage.setItem('remember_me', String(rememberMe))
      }

      // Store in appropriate storage based on remember me
      this.setTokensInStorage(data.token, null)
      this.setUserInStorage(data.user)

      return {
        user: data.user,
        tokens: {
          accessToken: data.token,
          refreshToken: ''
        }
      }
    } catch (error) {
      throw error
    }
  }

  // Register user
  async register(userData: RegisterData, rememberMe: boolean = true): Promise<AuthResponse> {
    try {
      // Set remember me preference before storing
      this.rememberMe = rememberMe

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Registration failed')
      }

      const data = await response.json()

      // Store tokens and user data
      this.accessToken = data.token
      this.user = data.user

      // Store remember me preference in localStorage (always persist this)
      if (typeof window !== 'undefined') {
        localStorage.setItem('remember_me', String(rememberMe))
      }

      // Store in appropriate storage based on remember me
      this.setTokensInStorage(data.token, null)
      this.setUserInStorage(data.user)

      return {
        user: data.user,
        tokens: {
          accessToken: data.token,
          refreshToken: ''
        }
      }
    } catch (error) {
      throw error
    }
  }

  // Refresh tokens
  async refreshTokenPair(): Promise<TokenResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()

      // Update tokens
      this.accessToken = data.data.accessToken
      this.refreshToken = data.data.refreshToken

      // Store in secure storage
      this.setTokensInStorage(data.data.accessToken, data.data.refreshToken)

      return data.data
    } catch (error) {
      // Clear tokens on refresh failure
      this.logout()
      throw error
    }
  }

  // Logout user
  async logout(): Promise<void> {
    this.accessToken = null
    this.refreshToken = null
    this.user = null

    // Clear local storage
    this.clearStorage()

    // Clear server cookie
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Failed to clear server cookie during logout')
    }
  }

  // Initialize auth state from storage
  async initializeAuth(): Promise<AuthState> {
    try {
      const accessToken = this.getTokenFromStorage()
      const userData = this.getUserFromStorage()

      if (accessToken && userData) {
        this.accessToken = accessToken
        this.user = userData

        // We trust the token from storage for initial load. 
        // Real verification happens when we make API calls.
        return {
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null
        }
      }

      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
    } catch (error) {
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize auth'
      }
    }
  }

  // Private methods for storage handling
  private setTokensInStorage(accessToken: string, refreshToken: string | null): void {
    const storage = this.getStorage()
    if (storage) {
      storage.setItem('access_token', accessToken)
      if (refreshToken) {
        storage.setItem('refresh_token', refreshToken)
      }
    }
  }

  private setUserInStorage(user: User): void {
    const storage = this.getStorage()
    if (storage) {
      storage.setItem('user', JSON.stringify(user))
    }
  }

  private getTokenFromStorage(): string | null {
    if (typeof window !== 'undefined') {
      // Check localStorage first (remember me = true), then sessionStorage
      return localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    }
    return null
  }

  private getUserFromStorage(): User | null {
    if (typeof window !== 'undefined') {
      // Check localStorage first (remember me = true), then sessionStorage
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    }
    return null
  }

  private clearStorage(): void {
    if (typeof window !== 'undefined') {
      // Clear from both storages
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('remember_me')
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
      sessionStorage.removeItem('user')
    }
  }
}

export default AuthenticationService.getInstance()
