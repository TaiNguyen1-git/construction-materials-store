import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to handle authentication routing
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ===== IP & GUEST BAN ENFORCEMENT =====
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  
  const isRestrictedPage = pathname.startsWith('/restricted')
  const isIntegrityAPI = pathname.startsWith('/api/integrity')
  const isApiRoute = pathname.startsWith('/api/')
  const isRSC = request.headers.has('rsc') || request.headers.has('next-router-prefetch')
  
  if (!isRestrictedPage && !isIntegrityAPI && !isApiRoute && !isRSC && !pathname.startsWith('/_next') && !pathname.includes('.')) {
    try {
      // Thêm AbortController để giới hạn thời gian chờ (tránh treo trang)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)

      const checkResponse = await fetch(new URL(`/api/integrity/check-ip?ip=${clientIp}`, request.url), {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (checkResponse.ok) {
        const data = await checkResponse.json()
        const { restricted, reason, type, endDate } = data
        
        if (restricted) {
          const url = new URL('/restricted', request.url)
          url.searchParams.set('reason', reason || '')
          url.searchParams.set('type', type || 'IP_BAN')
          if (endDate) url.searchParams.set('until', endDate)
          
          return NextResponse.redirect(url)
        }
      }
    } catch (e) {
      // Chỉ log lỗi nếu không phải là do timeout chủ động
      if ((e as any).name !== 'AbortError') {
        console.error('Middleware IP Check skipped (API unreachable):', clientIp)
      }
    }
  }

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next()
  }

  // ===== CRON JOB SECURITY =====
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

  // ===== TOKEN EXTRACTION & REFRESH =====
  let token = extractToken(request)
  const refreshToken = request.cookies.get('refresh_token')?.value
  let isExpired = false
  let payload: any = null

  if (token) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
          isExpired = true
          payload = null
        }
      }
    } catch {
      isExpired = true
      payload = null
    }
  }

  // ===== PROTECTION CHECK (Moved up for refresh logic) =====
  const publicRoutes = ['/api/reviews', '/api/notifications', '/api/contractors/public', '/api/supplier/auth', '/api/analytics/track', '/api/auth/refresh']
  const publicPages = ['/', '/login', '/register', '/forgot-password', '/products', '/categories', '/cart', '/checkout', '/order-tracking', '/about', '/contact', '/privacy', '/terms', '/contractors', '/projects', '/estimator', '/market']
  const publicPartnerPages = ['/contractor', '/contractor/login', '/contractor/register', '/supplier', '/supplier/login', '/supplier/register']

  const isPublicPage = publicPages.some(p => pathname === p || (p !== '/' && pathname.startsWith(p + '/')))
  const isPublicPartnerPage = publicPartnerPages.some(p => pathname === p)
  const isPublicRoute = publicRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isPublic = isPublicPage || isPublicPartnerPage || isPublicRoute

  // Silent Refresh if expired or missing but refresh token exists
  // Only attempt refresh for protected or optional auth routes to avoid overhead on every public asset
  const isRefreshNeeded = (isExpired || !token) && refreshToken && !isPublic
  const isAuthRequiredPath = (pathname.startsWith('/admin') || pathname.startsWith('/api/') || pathname.startsWith('/account') || pathname.startsWith('/contractor') || pathname.startsWith('/supplier')) && !isPublic

  if (isRefreshNeeded && isAuthRequiredPath) {
    try {
      const refreshResponse = await fetch(new URL('/api/auth/refresh', request.url), {
        method: 'POST',
        headers: { 'Cookie': `refresh_token=${refreshToken}` }
      })

      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        if (data.success) {
          const setCookieHeader = refreshResponse.headers.get('set-cookie')
          if (setCookieHeader) {
            const cookies = setCookieHeader.split(',').map(c => c.trim())
            let newToken = ''
            cookies.forEach(c => {
              const [nv] = c.split(';')
              const [n, v] = nv.split('=')
              if (n.includes('_token')) newToken = v
            })

            if (newToken) {
              token = newToken
              const parts = token.split('.')
              payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
              
              // Prepare the response with updated request headers
              const requestHeaders = new Headers(request.headers)
              requestHeaders.set('x-token', token)
              requestHeaders.set('authorization', `Bearer ${token}`)
              if (payload.userId) requestHeaders.set('x-user-id', payload.userId)
              if (payload.role) requestHeaders.set('x-user-role', payload.role)
              if (payload.email) requestHeaders.set('x-user-email', payload.email)

              const nextResponse = NextResponse.next({ request: { headers: requestHeaders } })
              
              // Set new cookies on the response
              cookies.forEach(c => {
                const [nv] = c.split(';')
                const [n, v] = nv.split('=')
                nextResponse.cookies.set(n, v, {
                  httpOnly: c.includes('HttpOnly'),
                  secure: c.includes('Secure'),
                  sameSite: 'lax',
                  path: '/',
                })
              })
              return nextResponse
            }
          }
        }
      }
    } catch (err) {
      console.error('[Middleware Refresh] Failed:', err)
    }
  }

  // Inject headers for valid tokens
  const requestHeaders = new Headers(request.headers)
  if (token && !isExpired) {
    requestHeaders.set('x-token', token)
    if (!request.headers.get('authorization')) {
      requestHeaders.set('authorization', `Bearer ${token}`)
    }
    if (payload) {
      if (payload.userId) requestHeaders.set('x-user-id', payload.userId)
      if (payload.role) requestHeaders.set('x-user-role', payload.role)
      if (payload.email) requestHeaders.set('x-user-email', payload.email)
    }
  }

  if (isPublic) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Protected patterns
  const protectedAPIPatterns = ['/api/admin', '/api/employee', '/api/inventory', '/api/payroll', '/api/employee-tasks', '/api/work-shifts', '/api/attendance', '/api/ocr', '/api/predictions', '/api/analytics', '/api/supplier-orders', '/api/contractor', '/api/contractors', '/api/employees', '/api/projects', '/api/tasks', '/api/materials']
  const protectedPagePatterns = ['/admin', '/account', '/contractor', '/supplier']

  const isProtectedAPI = protectedAPIPatterns.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isProtectedPage = protectedPagePatterns.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isProtectedAPI || isProtectedPage) {
    if (!token || isExpired) {
      if (isProtectedAPI) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: isExpired ? 'Token expired' : 'Access token required' } },
          { status: 401 }
        )
      }
      
      let loginPath = '/login'
      if (pathname.startsWith('/contractor')) loginPath = '/contractor/login'
      else if (pathname.startsWith('/supplier')) loginPath = '/supplier/login'
      
      const loginUrl = new URL(loginPath, request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      const clearResponse = NextResponse.redirect(loginUrl)
      if (isExpired) {
        ['auth_token', 'admin_token', 'contractor_token', 'supplier_token'].forEach(c => clearResponse.cookies.set(c, '', { maxAge: 0 }))
      }
      return clearResponse
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

function extractToken(request: NextRequest): string | null {
  const { pathname } = request.nextUrl
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const headerToken = authHeader.slice(7)
    if (headerToken && headerToken !== 'null' && headerToken !== 'undefined' && headerToken !== '[object Object]') {
      return headerToken
    }
  }

  const sharedAPIs = ['/api/chat']
  if (sharedAPIs.some(api => pathname.startsWith(api))) {
    return request.cookies.get('admin_token')?.value || request.cookies.get('supplier_token')?.value || request.cookies.get('contractor_token')?.value || request.cookies.get('auth_token')?.value || null
  }

  let cookieName = 'auth_token'
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/api/inventory') || pathname.startsWith('/api/predictions') || pathname.startsWith('/api/employees') || pathname.startsWith('/api/projects')
  
  if (isAdminPath) cookieName = 'admin_token'
  else if (pathname.startsWith('/supplier') || pathname.startsWith('/api/supplier')) cookieName = 'supplier_token'
  else if (pathname.startsWith('/contractor') || pathname.startsWith('/api/contractor')) cookieName = 'contractor_token'

  return request.cookies.get(cookieName)?.value || request.cookies.get('admin_token')?.value || request.cookies.get('supplier_token')?.value || request.cookies.get('contractor_token')?.value || request.cookies.get('auth_token')?.value || null
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
