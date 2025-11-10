import { headers, NextRequest } from 'next/headers'
import { AuthService, JWTPayload } from './auth'
import { NextResponse } from 'next/server'

/**
 * Get token from NextRequest object (set by middleware in x-token header or from Authorization)
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Try x-token header first (set by middleware)
  let token = request.headers.get('x-token')
  
  if (!token) {
    // Try x-auth-token header (from client)
    token = request.headers.get('x-auth-token')
  }
  
  if (!token) {
    // Try Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    }
  }
  
  return token
}

/**
 * Verify and get JWT payload from request
 */
export function verifyTokenFromRequest(request: NextRequest): JWTPayload | null {
  try {
    const token = getTokenFromRequest(request)
    
    if (!token) {
      return null
    }
    
    const payload = AuthService.verifyAccessToken(token) as JWTPayload
    return payload
  } catch (error: any) {
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
