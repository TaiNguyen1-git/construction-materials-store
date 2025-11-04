// Helper functions for API authentication checks
import { NextRequest } from 'next/server'
import { UserRole } from '@/lib/auth'

export function getUserFromHeaders(request: NextRequest) {
  return {
    userId: request.headers.get('x-user-id'),
    email: request.headers.get('x-user-email'),
    role: request.headers.get('x-user-role') as UserRole | null,
  }
}

export function requireAuth(request: NextRequest, allowedRoles?: UserRole[]) {
  // Skip authentication in development mode
  if (process.env.NODE_ENV === 'development') {
    return { authorized: true, user: { userId: 'dev-user', email: 'dev@example.com', role: 'MANAGER' as UserRole } }
  }

  const user = getUserFromHeaders(request)
  
  if (!user.userId || !user.role) {
    return { authorized: false, error: 'Unauthorized', status: 401 }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { authorized: false, error: 'Forbidden', status: 403 }
  }

  return { authorized: true, user }
}

export function requireManager(request: NextRequest) {
  return requireAuth(request, [UserRole.MANAGER])
}

export function requireEmployee(request: NextRequest) {
  return requireAuth(request, [UserRole.MANAGER, UserRole.EMPLOYEE])
}
