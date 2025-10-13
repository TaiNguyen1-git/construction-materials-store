import { NextRequest, NextResponse } from 'next/server'
import { AuthService, JWTPayload } from '@/lib/auth'
// Note: Rate limiting disabled in middleware due to Edge Runtime limitations
// Redis client requires Node.js runtime. Consider using Vercel KV or Upstash Redis
// import { rateLimitMiddleware } from '@/lib/rate-limit'

// Define protected routes
const protectedRoutes = [
  '/api/admin',
  '/api/employee',
  '/api/inventory',
  '/api/orders',
  '/api/invoices',
  '/api/payroll',
  '/api/employee-tasks',
  '/api/work-shifts',
  '/api/attendance',
  '/api/ocr',
  '/api/predictions',
  '/api/recommendations',
]

const adminOnlyRoutes = [
  '/api/admin/employees',
  '/api/admin/users',
  '/api/admin/reports',
  '/api/admin/settings',
  '/api/predictions',
  '/api/recommendations/purchase',
]

const employeeRoutes = [
  '/api/employee',
  '/api/inventory',
  '/api/orders/manage',
  '/api/invoices/create',
  '/api/employee-tasks',
  '/api/work-shifts',
  '/api/attendance',
  '/api/ocr',
  '/api/recommendations',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous'

  // Skip middleware for public routes and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/public')
  ) {
    return NextResponse.next()
  }

  // Rate limiting temporarily disabled in Edge Runtime middleware
  // Redis client requires Node.js runtime which is not available in Edge Runtime
  // 
  // Options to enable rate limiting:
  // 1. Use Vercel KV (recommended for Vercel deployment)
  // 2. Use Upstash Redis (edge-compatible)
  // 3. Implement rate limiting in API routes instead (Node.js runtime)
  // 4. Use a different edge-compatible solution
  //
  // For now, rate limiting is disabled in middleware but can be added to individual API routes

  // Check if route needs protection
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get token from Authorization header
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Access token required' } },
      { status: 401 }
    )
  }

  try {
    // Verify token
    const payload = AuthService.verifyAccessToken(token) as JWTPayload
    
    // Check role-based access
    const isAdminOnlyRoute = adminOnlyRoutes.some(route => pathname.startsWith(route))
    const isEmployeeRoute = employeeRoutes.some(route => pathname.startsWith(route))

    if (isAdminOnlyRoute && payload.role !== 'MANAGER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Manager access required' } },
        { status: 403 }
      )
    }

    if (isEmployeeRoute && !['MANAGER', 'EMPLOYEE'].includes(payload.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Employee access required' } },
        { status: 403 }
      )
    }

    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-email', payload.email)
    requestHeaders.set('x-user-role', payload.role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
      { status: 401 }
    )
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}