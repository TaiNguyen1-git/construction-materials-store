import jwt, { JwtPayload } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Define enum locally until Prisma client is generated
export enum UserRole {
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER',
  CONTRACTOR = 'CONTRACTOR',
  SUPPLIER = 'SUPPLIER'
}

export interface JWTPayload extends JwtPayload {
  userId: string
  email: string
  role: UserRole
}

// 🛡️ SECURITY: Fail-fast if JWT secrets are not configured
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === 'your-super-secret-jwt-key') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: JWT_SECRET must be configured in production!')
    }
    console.warn('⚠️ WARNING: Using default JWT_SECRET. Set JWT_SECRET env var for production!')
    return 'dev-only-jwt-secret-not-for-production'
  }
  return secret
}

const getJwtRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret || secret === 'your-super-secret-refresh-key') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: JWT_REFRESH_SECRET must be configured in production!')
    }
    console.warn('⚠️ WARNING: Using default JWT_REFRESH_SECRET. Set JWT_REFRESH_SECRET env var for production!')
    return 'dev-only-refresh-secret-not-for-production'
  }
  return secret
}

export const AUTH_CONFIG = {
  JWT_SECRET: getJwtSecret(),
  JWT_REFRESH_SECRET: getJwtRefreshSecret(),
  ACCESS_TOKEN_EXPIRES_IN: '1h' as const, // Tăng lên 1h để demo/dev đỡ bị out
  REFRESH_TOKEN_EXPIRES_IN: '7d' as const,  // Dài để duy trì login
  BCRYPT_ROUNDS: 12 as const,
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }
} as const

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AUTH_CONFIG.BCRYPT_ROUNDS)
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  static generateAccessToken(payload: Pick<JWTPayload, 'userId' | 'email' | 'role'>): string {
    return jwt.sign(
      payload,
      AUTH_CONFIG.JWT_SECRET,
      { expiresIn: AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN }
    )
  }

  static generateRefreshToken(payload: Pick<JWTPayload, 'userId' | 'email' | 'role'>): string {
    return jwt.sign(
      payload,
      AUTH_CONFIG.JWT_REFRESH_SECRET,
      { expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN }
    )
  }

  static verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, AUTH_CONFIG.JWT_SECRET) as JWTPayload
  }

  static verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, AUTH_CONFIG.JWT_REFRESH_SECRET) as JWTPayload
  }

  static generateTokenPair(payload: Pick<JWTPayload, 'userId' | 'email' | 'role'>) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    }
  }

  /**
   * Get cookie name based on user role
   */
  static getCookieNameForRole(role: UserRole): string {
    switch (role) {
      case UserRole.MANAGER:
      case UserRole.EMPLOYEE:
        return 'admin_token'
      case UserRole.CONTRACTOR:
        return 'contractor_token'
      case UserRole.SUPPLIER:
        return 'supplier_token'
      default:
        return 'auth_token'
    }
  }

  /**
   * Set authentication cookies in the response
   * Uses role-specific cookie names to allow independent portal sessions
   */
  static setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string, role?: UserRole) {
    // Determine cookie name based on role
    const cookieName = role ? this.getCookieNameForRole(role) : 'auth_token'

    response.cookies.set(cookieName, accessToken, {
      ...AUTH_CONFIG.COOKIE_OPTIONS,
      maxAge: 60 * 60, // 1 hour
    })

    response.cookies.set('refresh_token', refreshToken, {
      ...AUTH_CONFIG.COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })
  }

  /**
   * Clear authentication cookies (all portal-specific cookies)
   */
  static clearAuthCookies(response: NextResponse) {
    // Clear all portal-specific cookies
    response.cookies.set('auth_token', '', { ...AUTH_CONFIG.COOKIE_OPTIONS, maxAge: 0 })
    response.cookies.set('admin_token', '', { ...AUTH_CONFIG.COOKIE_OPTIONS, maxAge: 0 })
    response.cookies.set('contractor_token', '', { ...AUTH_CONFIG.COOKIE_OPTIONS, maxAge: 0 })
    response.cookies.set('supplier_token', '', { ...AUTH_CONFIG.COOKIE_OPTIONS, maxAge: 0 })
    response.cookies.set('refresh_token', '', { ...AUTH_CONFIG.COOKIE_OPTIONS, maxAge: 0 })
  }
}

export const hasPermission = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole)
}

export const isManager = (userRole: UserRole): boolean => {
  return userRole === UserRole.MANAGER
}

export const isEmployee = (userRole: UserRole): boolean => {
  return userRole === UserRole.EMPLOYEE || userRole === UserRole.MANAGER
}

export const isCustomer = (userRole: UserRole): boolean => {
  return userRole === UserRole.CUSTOMER
}

export async function getUser() {
  const cookieStore = await cookies()

  // Try all portal-specific cookies
  const token = cookieStore.get('auth_token')?.value
    || cookieStore.get('admin_token')?.value
    || cookieStore.get('contractor_token')?.value
    || cookieStore.get('supplier_token')?.value

  if (!token) return null

  try {
    const payload = AuthService.verifyAccessToken(token)
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    }
  } catch (error) {
    return null
  }
}

export async function verifyTokenFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const authHeader = req.headers.get('authorization')
  let token = authHeader?.split(' ')[1]

  // Fallback to cookie if header is missing - try all portal-specific cookies
  if (!token) {
    const cookieStore = await cookies()
    token = cookieStore.get('auth_token')?.value
      || cookieStore.get('admin_token')?.value
      || cookieStore.get('contractor_token')?.value
      || cookieStore.get('supplier_token')?.value
  }

  // 🛡️ SECURITY FIX: Removed dangerous x-user-id fallback that allowed header spoofing
  // If no valid token is provided, return null - no shortcuts allowed
  if (!token) {
    return null
  }

  try {
    return AuthService.verifyAccessToken(token)
  } catch (error) {
    // Token verification failed - return null, do NOT fall back to headers
    return null
  }
}