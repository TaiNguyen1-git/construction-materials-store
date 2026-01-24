import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { loginSchema, validateRequest } from '@/lib/validation'
import { logger, logAuth, logAPI } from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limit-api'
import { EmailService } from '@/lib/email-service'

// Helper to hash token for storage
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Helper to get client info
function getClientInfo(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'Unknown'
  const tabId = request.headers.get('x-tab-id') || null

  // Parse user agent for device info
  let deviceInfo = 'Unknown Device'
  if (userAgent.includes('Mobile')) {
    deviceInfo = 'Điện thoại'
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceInfo = 'Máy tính bảng'
  } else if (userAgent.includes('Windows')) {
    deviceInfo = 'Windows PC'
  } else if (userAgent.includes('Mac')) {
    deviceInfo = 'Mac'
  } else if (userAgent.includes('Linux')) {
    deviceInfo = 'Linux'
  }

  // Add browser info
  if (userAgent.includes('Chrome')) {
    deviceInfo += ' - Chrome'
  } else if (userAgent.includes('Firefox')) {
    deviceInfo += ' - Firefox'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    deviceInfo += ' - Safari'
  } else if (userAgent.includes('Edge')) {
    deviceInfo += ' - Edge'
  }

  return { userAgent, ip, tabId, deviceInfo }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get client IP for rate limiting
    const clientInfo = getClientInfo(request)

    // Apply rate limiting (5 attempts per 15 minutes per IP)
    const rateLimitResult = await checkRateLimit(`login:${clientInfo.ip}`, 'AUTH')
    if (!rateLimitResult.success) {
      logAPI.error('POST', '/api/auth/login', new Error('Rate limit exceeded'), { ip: clientInfo.ip })
      return NextResponse.json(
        {
          success: false,
          error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.',
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)),
          }
        }
      )
    }

    const body = await request.json()

    // Validate with Zod
    const validation = validateRequest(loginSchema, body)
    if (!validation.success) {
      logAPI.error('POST', '/api/auth/login', new Error('Validation failed'), { errors: validation.errors })
      return NextResponse.json(
        {
          success: false,
          error: 'Dữ liệu không hợp lệ',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      logAuth.failed(email, 'User not found')
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      logAuth.failed(email, 'User inactive')
      return NextResponse.json(
        { success: false, error: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.' },
        { status: 403 }
      )
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      logAuth.failed(email, 'Invalid password')
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!user.emailVerified) {
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt }
      })

      // Send OTP
      await EmailService.sendOTP({
        email: user.email,
        name: user.name,
        otpCode,
        type: 'VERIFICATION'
      })

      // Short-lived verification token
      const verificationToken = jwt.sign(
        { userId: user.id, email: user.email, purpose: 'email_verification' },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      )

      return NextResponse.json({
        success: true,
        verificationRequired: true,
        verificationToken,
        email: user.email
      })
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured')
    }

    // Check for 2FA requirement (User defined)
    const requires2FA = user.is2FAEnabled

    if (requires2FA) {
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Update user with OTP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode,
          otpExpiresAt
        }
      })

      // Send OTP via Email
      const emailSent = await EmailService.sendOTP({
        email: user.email,
        name: user.name,
        otpCode,
        type: '2FA',
        expiresInMinutes: 10
      })

      if (!emailSent) {
        logger.error('Failed to send 2FA email', { email: user.email })
      }

      // Generate a short-lived 2FA verification token
      const verificationToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          purpose: '2fa'
        },
        jwtSecret,
        { expiresIn: '15m' }
      )

      const duration = Date.now() - startTime
      logAPI.response('POST', '/api/auth/login', 200, duration)

      return NextResponse.json({
        success: true,
        twoFactorRequired: true,
        verificationToken,
        email: user.email
      })
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Create session record in database
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash,
        deviceInfo: clientInfo.deviceInfo,
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        tabId: clientInfo.tabId,
        expiresAt,
        lastActivityAt: new Date(),
      }
    })

    // Log successful login
    logAuth.login(user.id, user.email, true)

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    const duration = Date.now() - startTime
    logAPI.response('POST', '/api/auth/login', 200, duration)

    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
      sessionId: session.id,
      needs2FASetupPrompt: !(user as any).hasSetTwoFactor,
    })

    // Set HTTP-only cookie for middleware protection
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error: any) {
    const duration = Date.now() - startTime
    logAPI.error('POST', '/api/auth/login', error, { duration })
    logger.error('Login error', { error: error.message, stack: error.stack })

    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
