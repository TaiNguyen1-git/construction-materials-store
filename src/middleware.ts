import { NextRequest, NextResponse } from 'next/server'
import { AuthService, JWTPayload } from '@/lib/auth'
// Note: Rate limiting disabled in middleware due to Edge Runtime limitations
// Redis client requires Node.js runtime. Consider using Vercel KV or Upstash Redis
// import { rateLimitMiddleware } from '@/lib/rate-limit'

// Define protected routes (requires authentication)
const protectedRoutes = [
  '/api/admin',
  '/api/employee',
  '/api/inventory',
  '/api/payroll',
  '/api/employee-tasks',
  '/api/work-shifts',
  '/api/attendance',
  '/api/ocr',
  '/api/predictions/accuracy',
  '/api/recommendations/purchase',
  '/api/notifications',
  '/api/analytics',
  '/api/suppliers',
  '/api/admin/reviews',
]

// Public routes that don't require authentication
const publicRoutes = [
  '/api/products',
  '/api/categories',
  '/api/recommendations',
  '/api/recommendations/cart',
  '/api/recommendations/review-based',
  '/api/customers',
  '/api/reviews',
]

// Routes where authentication is optional (guest can access, but authenticated users get full access)
const optionalAuthRoutes = [
  '/api/orders',
  '/api/invoices',
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

  // Try multiple header sources due to Edge Runtime issues
  let token: string | null = null
  
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7)
    console.log('[Middleware] Token extracted from Authorization header, length:', token.length)
  }
  
  // If not found, try custom header (for Vercel Edge Runtime compatibility)
  if (!token) {
    token = request.headers.get('x-auth-token')
    if (token) {
      console.log('[Middleware] Token extracted from x-auth-token header, length:', token.length)
    }
  }

  // For optional auth routes, allow guest access (no token)
  if (!token && isOptionalAuthRoute) {
    console.log('[Middleware] Optional auth route, no token required:', pathname)
    return NextResponse.next()
  }

  if (!token) {
    console.log('[Middleware] Protected route but no token found:', pathname)
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Access token required' } },
      { status: 401 }
    )
  }
  
  // Note: JWT verification moved to API routes because Edge Runtime doesn't support crypto module
  // Token verification will happen in API route middleware/handlers
  // Here we just extract and pass token to API routes
  
  console.log('[Middleware] Setting x-token header for route:', pathname)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-token', token)
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
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