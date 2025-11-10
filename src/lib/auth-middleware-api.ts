import { headers, NextRequest } from 'next/headers'
import { AuthService, JWTPayload } from './auth'
import { NextResponse } from 'next/server'

/**
 * Get token from NextRequest object (set by middleware in x-token header)
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.headers.get('x-token')
  return token
}

/**
 * Verify and get JWT payload from request
 */
export function verifyTokenFromRequest(request: NextRequest): JWTPayload | null {
  try {
    const token = getTokenFromRequest(request)
    
    if (!token) {
      console.log('[API Auth] No token found in x-token header')
      return null
    }
    
    console.log('[API Auth] Verifying token:', token.substring(0, 20) + '...')
    const payload = AuthService.verifyAccessToken(token) as JWTPayload
    console.log('[API Auth] Token verified successfully for user:', payload.userId)
    
    return payload
  } catch (error: any) {
    console.error('[API Auth] Token verification failed:', error.message)
    return null
  }
}

/**
 * Require authentication for API route
 * Returns NextResponse error if not authenticated, null if OK
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const payload = verifyTokenFromRequest(request)
  
  if (!payload) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing token' },
      { status: 401 }
    )
  }
  
  return null
}

/**
 * Require admin/manager role
 * Returns NextResponse error if not authorized, null if OK
 */
export function requireManager(request: NextRequest): NextResponse | null {
  const payload = verifyTokenFromRequest(request)
  
  if (!payload) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing token' },
      { status: 401 }
    )
  }
  
  if (payload.role !== 'MANAGER') {
    return NextResponse.json(
      { error: 'Forbidden - Manager access required' },
      { status: 403 }
    )
  }
  
  return null
}

/**
 * Require employee or manager role
 * Returns NextResponse error if not authorized, null if OK
 */
export function requireEmployee(request: NextRequest): NextResponse | null {
  const payload = verifyTokenFromRequest(request)
  
  if (!payload) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing token' },
      { status: 401 }
    )
  }
  
  if (!['MANAGER', 'EMPLOYEE'].includes(payload.role)) {
    return NextResponse.json(
      { error: 'Forbidden - Employee access required' },
      { status: 403 }
    )
  }
  
  return null
}
