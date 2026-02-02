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

  // ===== CRON JOB SECURITY (Vercel Cron) =====
  if (pathname === '/api/admin/reports/trigger') {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (process.env.NODE_ENV === 'production') {
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
          { status: 401 }
        )
      }
    }
    return NextResponse.next()
  }

  // ===== PUBLIC ROUTES (no auth required) =====
  const publicRoutes = [
    '/api/reviews',
    '/api/notifications',
    '/api/contractors/public',
    '/api/supplier/auth',
    '/api/supplier/auth/2fa/verify',
  ]

  // ===== PUBLIC PAGES (no auth required) =====
  const publicPages = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/products',
    '/categories',
    '/cart',
    '/checkout',
    '/order-tracking',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/contractors',
    '/projects',
    '/estimator',
    '/market',
  ]

  const publicPartnerPages = [
    '/contractor',
    '/contractor/login',
    '/contractor/register',
    '/supplier',
    '/supplier/login',
    '/supplier/register',
    '/supplier/register/success',
    '/supplier/terms',
  ]

  const isPublicPage = publicPages.some(page =>
    pathname === page ||
    (page !== '/' && pathname.startsWith(page + '/'))
  )

  const isPublicPartnerPage = publicPartnerPages.some(page => pathname === page)

  if (isPublicPage || isPublicPartnerPage) {
    return NextResponse.next()
  }

  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/api/recommendations') &&
    !pathname.includes('/purchase')
  ) {
    return NextResponse.next()
  }

  // ===== ROUTES WITH OPTIONAL AUTH =====
  const optionalAuthRoutes = ['/api/orders', '/api/invoices', '/api/products', '/api/customers', '/api/categories', '/api/chat']

  if (optionalAuthRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    const token = extractToken(request)
    if (token) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-token', token)

      try {
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
          if (payload.userId) requestHeaders.set('x-user-id', payload.userId)
          if (payload.role) requestHeaders.set('x-user-role', payload.role)
          if (payload.email) requestHeaders.set('x-user-email', payload.email)
        }
      } catch { }

      return NextResponse.next({ request: { headers: requestHeaders } })
    }
    return NextResponse.next()
  }

  // ===== PROTECTED ROUTES Patterns =====
  const protectedAPIPatterns = [
    '/api/admin', '/api/employee', '/api/inventory', '/api/payroll',
    '/api/employee-tasks', '/api/work-shifts', '/api/attendance',
    '/api/ocr', '/api/predictions', '/api/notifications',
    '/api/analytics', '/api/supplier-orders', '/api/contractor', '/api/contractors',
  ]

  const protectedPagePatterns = [
    '/admin', '/account', '/contractor', '/supplier',
  ]

  const isProtectedAPI = protectedAPIPatterns.some(
    pattern => pathname === pattern || pathname.startsWith(pattern + '/')
  )

  const isProtectedPage = protectedPagePatterns.some(
    pattern => pathname === pattern || pathname.startsWith(pattern + '/')
  )

  // Skip further check if not protected
  if (!isProtectedAPI && !isProtectedPage) {
    return NextResponse.next()
  }

  // ===== PROTECTED AUTH CHECK & REFRESH =====
  let token = extractToken(request)
  const refreshToken = request.cookies.get('refresh_token')?.value
  let isExpired = false

  if (token) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) isExpired = true
      }
    } catch {
      isExpired = true
    }
  }

  // SILENT REFRESH
  if ((!token || isExpired) && refreshToken) {
    try {
      const refreshResponse = await fetch(new URL('/api/auth/refresh', request.url), {
        method: 'POST',
        headers: { 'Cookie': `refresh_token=${refreshToken}` }
      })

      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        if (data.success) {
          const setCookieHeader = refreshResponse.headers.get('set-cookie')
          const nextResponse = NextResponse.next()

          if (setCookieHeader) {
            const cookies = setCookieHeader.split(',').map(c => c.trim())
            cookies.forEach(cookieStr => {
              const [nameValue] = cookieStr.split(';')
              const [name, value] = nameValue.split('=')
              if (name.includes('_token')) token = value

              nextResponse.cookies.set(name, value, {
                httpOnly: cookieStr.includes('HttpOnly'),
                secure: cookieStr.includes('Secure'),
                sameSite: 'lax',
                path: '/',
              })
            })
          }

          if (token) {
            const parts = token.split('.')
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
            nextResponse.headers.set('x-token', token)
            nextResponse.headers.set('authorization', `Bearer ${token}`)
            if (payload.userId) nextResponse.headers.set('x-user-id', payload.userId)
            if (payload.role) nextResponse.headers.set('x-user-role', payload.role)
            return nextResponse
          }
        }
      }
    } catch (err) {
      console.error('[Middleware Refresh] Failed:', err)
    }
  }

  if (!token || isExpired) {
    if (isProtectedPage && !pathname.includes('/login') && !pathname.includes('/register')) {
      let loginPath = '/login'
      if (pathname.startsWith('/contractor')) loginPath = '/contractor/login'
      else if (pathname.startsWith('/supplier')) loginPath = '/supplier/login'

      const loginUrl = new URL(loginPath, request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)

      const clearResponse = NextResponse.redirect(loginUrl)
      if (isExpired) {
        ['auth_token', 'admin_token', 'contractor_token', 'supplier_token'].forEach(c => {
          clearResponse.cookies.set(c, '', { maxAge: 0 })
        })
      }
      return clearResponse
    }

    if (isProtectedAPI) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: isExpired ? 'Token expired' : 'Access token required' } },
        { status: 401 }
      )
    }
  }

  // Token is valid - inject headers
  const requestHeaders = new Headers(request.headers)
  if (token) {
    requestHeaders.set('x-token', token)
    if (!request.headers.get('authorization')) {
      requestHeaders.set('authorization', `Bearer ${token}`)
    }
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        if (payload.userId) requestHeaders.set('x-user-id', payload.userId)
        if (payload.role) requestHeaders.set('x-user-role', payload.role)
        if (payload.email) requestHeaders.set('x-user-email', payload.email)
      }
    } catch { }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Security Headers (simplified for this edit)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }

  return response
}

function extractToken(request: NextRequest): string | null {
  const { pathname } = request.nextUrl
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)

  const sharedAPIs = ['/api/chat']
  if (sharedAPIs.some(api => pathname.startsWith(api))) {
    return request.cookies.get('admin_token')?.value ||
      request.cookies.get('supplier_token')?.value ||
      request.cookies.get('contractor_token')?.value ||
      request.cookies.get('auth_token')?.value || null
  }

  let cookieName = 'auth_token'
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) cookieName = 'admin_token'
  else if (pathname.startsWith('/supplier') || pathname.startsWith('/api/supplier')) cookieName = 'supplier_token'
  else if (pathname.startsWith('/contractor') || pathname.startsWith('/api/contractor')) cookieName = 'contractor_token'

  return request.cookies.get(cookieName)?.value || request.cookies.get('auth_token')?.value || null
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
