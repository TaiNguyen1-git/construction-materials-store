// Use Web Crypto API for edge runtime compatibility
const CSRF_TOKEN_LENGTH = 32

// Generate CSRF token using Web Crypto API
export function generateCsrfToken(): string {
  // For Node.js environment
  if (typeof window === 'undefined') {
    // Dynamic import to avoid bundling issues
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto')
      return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
    } catch {
      // Fallback for edge runtime
      return Array.from({ length: CSRF_TOKEN_LENGTH * 2 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
    }
  }
  
  // For browser environment (Web Crypto API)
  const array = new Uint8Array(CSRF_TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Verify CSRF token
export function verifyCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false
  }
  return token === storedToken
}

// CSRF token cookie name
export const CSRF_COOKIE_NAME = '_csrf'
export const CSRF_HEADER_NAME = 'x-csrf-token'

// Get CSRF token from cookies
export function getCsrfTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)
  
  return cookies[CSRF_COOKIE_NAME] || null
}

// Simple token validation for API routes
export function validateCsrfToken(
  headerToken: string | null,
  cookieToken: string | null
): boolean {
  if (!headerToken || !cookieToken) {
    return false
  }
  
  return verifyCsrfToken(headerToken, cookieToken)
}
