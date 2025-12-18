import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to handle authentication routing
 * 
 * Strategy:
 * 1. Public routes: Pass through without token
 * 2. Optional auth routes: Pass through (with or without token)
 * 3. Protected routes: Require token, pass to API route for verification
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next()
  }

  // No bypass here anymore - follow production flow

  // ===== PUBLIC ROUTES (no auth required) =====
  const publicRoutes = [
    '/api/products',
    '/api/categories',
    '/api/customers',
    '/api/reviews',
  ]

  // ===== ROUTES WITH PUBLIC RECOMMENDATIONS (no auth required) =====
  // /api/recommendations and /api/recommendations/cart are public
  // But /api/recommendations/purchase is PROTECTED
  if (
    pathname.startsWith('/api/recommendations') &&
    !pathname.includes('/purchase')
  ) {
    return NextResponse.next()
  }

  // Check if route is public
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // ===== ROUTES WITH OPTIONAL AUTH =====
  const optionalAuthRoutes = ['/api/orders', '/api/invoices']

  if (optionalAuthRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    // Try to extract token but don't require it
    const token = extractToken(request)
    if (token) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-token', token)
      return NextResponse.next({
        request: { headers: requestHeaders },
      })
    }
    // No token but optional auth route - allow through
    return NextResponse.next()
  }

  // ===== PROTECTED ROUTES & PAGES (auth required) =====
  const protectedAPIPatterns = [
    '/api/admin',
    '/api/employee',
    '/api/inventory',
    '/api/payroll',
    '/api/employee-tasks',
    '/api/work-shifts',
    '/api/attendance',
    '/api/ocr',
    '/api/predictions',
    '/api/notifications',
    '/api/analytics',
    '/api/suppliers',
    '/api/recommendations/purchase',
  ]

  const protectedPagePatterns = [
    '/admin',
    '/account',
    '/contractor',
    '/supplier',
  ]

  const isProtectedAPI = protectedAPIPatterns.some(
    pattern => pathname === pattern || pathname.startsWith(pattern + '/')
  )

  const isProtectedPage = protectedPagePatterns.some(
    pattern => pathname === pattern || pathname.startsWith(pattern + '/')
  )

  if (!isProtectedAPI && !isProtectedPage) {
    // Not a protected route or page - pass through
    return NextResponse.next()
  }

  // Check for token from headers or cookie
  const token = extractToken(request)

  if (!token) {
    // Handle redirect for pages (not logged in)
    if (isProtectedPage && !pathname.includes('/login') && !pathname.includes('/register')) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Handle 401 for API
    if (isProtectedAPI) {
      console.log('[Middleware] Protected API requires auth:', pathname)
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Access token required' } },
        { status: 401 }
      )
    }
  }

  // Token found - pass it to downstream via headers
  const requestHeaders = new Headers(request.headers)
  if (token) {
    requestHeaders.set('x-token', token)
    // Also set Authorization header for API routes that need it
    if (!request.headers.get('authorization')) {
      requestHeaders.set('authorization', `Bearer ${token}`)
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

/**
 * Extract token from request (try multiple sources)
 */
function extractToken(request: NextRequest): string | null {
  // 1. Try Authorization: Bearer token (API calls from frontend)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // 2. Try auth_token cookie (for page loads after login)
  const cookieToken = request.cookies.get('auth_token')?.value
  if (cookieToken) {
    return cookieToken
  }

  // 3. Try x-auth-token header
  const customToken = request.headers.get('x-auth-token')
  if (customToken) {
    return customToken
  }

  // 4. Try x-token header (already set by client)
  const xToken = request.headers.get('x-token')
  if (xToken) {
    return xToken
  }

  return null
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
