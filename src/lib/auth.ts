import jwt, { JwtPayload } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Define enum locally until Prisma client is generated
export enum UserRole {
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER'
}

export interface JWTPayload extends JwtPayload {
  userId: string
  email: string
  role: UserRole
}

export const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
  ACCESS_TOKEN_EXPIRES_IN: '1d' as const,
  REFRESH_TOKEN_EXPIRES_IN: '7d' as const,
  BCRYPT_ROUNDS: 12 as const,
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