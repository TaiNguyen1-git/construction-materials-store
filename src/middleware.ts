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
  '/api/notifications',
]

// Public routes that don't require authentication
const publicRoutes = [
  '/api/recommendations/cart', // Recommendations for cart (guest can access)
  '/api/recommendations/review-based', // Review-based recommendations (guest can access)
]

// Routes where authentication is optional (guest can access, but authenticated users get full access)
const optionalAuthRoutes = [
  '/api/orders', // Guest creates order, Admin views all orders
  '/api/invoices', // Guest views invoice, Admin views all invoices
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

  // BYPASS AUTHENTICATION IN LOCAL DEVELOPMENT MODE ONLY
  // Production (Vercel) uses NODE_ENV='production' with JWT verification
  if (process.env.NODE_ENV === 'development' && process.env.VERCEL !== '1') {
    console.log('[Middleware] Development mode - bypassing auth')
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', 'dev-user')
    requestHeaders.set('x-user-email', 'dev@example.com')
    requestHeaders.set('x-user-role', 'MANAGER')
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
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

  // Check if route is in public exceptions (no auth needed)
  const isPublicException = publicRoutes.some(route => pathname.startsWith(route))
  if (isPublicException) {
    console.log('[Middleware] Public route exception:', pathname)
    return NextResponse.next()
  }

  // Check if route has optional authentication
  const isOptionalAuthRoute = optionalAuthRoutes.some(route => pathname.startsWith(route))
  
  // Check if route needs protection
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (!isProtectedRoute && !isOptionalAuthRoute) {
    console.log('[Middleware] Route not protected:', pathname)
    return NextResponse.next()
  }

  // Get token from Authorization header
  const authHeader = request.headers.get('authorization')
  console.log('[Middleware] Route:', pathname)
  console.log('[Middleware] Auth header:', authHeader?.substring(0, 30) + '...' || 'NO HEADER')
  
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  // For optional auth routes, allow guest access (no token)
  if (!token && isOptionalAuthRoute) {
    console.log('[Middleware] Optional auth route, allowing guest access:', pathname)
    return NextResponse.next()
  }

  if (!token) {
    console.log('[Middleware] NO TOKEN - returning 401')
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Access token required' } },
      { status: 401 }
    )
  }
  
  console.log('[Middleware] Token found:', token.substring(0, 20) + '...')

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

  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    console.error('[Middleware] Token verification FAILED')
    console.error('[Middleware] Token:', token?.substring(0, 30) + '...')
    console.error('[Middleware] Error:', errorMsg)
    console.error('[Middleware] Full error:', error)
    console.error('[Middleware] JWT_SECRET exists:', !!process.env.JWT_SECRET)
    console.error('[Middleware] NODE_ENV:', process.env.NODE_ENV)
    
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token', details: errorMsg } },
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