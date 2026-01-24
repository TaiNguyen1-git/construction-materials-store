import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { registerSchema, validateRequest, sanitizeString } from '@/lib/validation'
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

  let deviceInfo = 'Unknown Device'
  if (userAgent.includes('Mobile')) {
    deviceInfo = 'Điện thoại'
  } else if (userAgent.includes('Windows')) {
    deviceInfo = 'Windows PC'
  } else if (userAgent.includes('Mac')) {
    deviceInfo = 'Mac'
  }

  if (userAgent.includes('Chrome')) {
    deviceInfo += ' - Chrome'
  } else if (userAgent.includes('Firefox')) {
    deviceInfo += ' - Firefox'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    deviceInfo += ' - Safari'
  }

  return { userAgent, ip, tabId, deviceInfo }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get client info for rate limiting
    const clientInfo = getClientInfo(request)

    // Apply rate limiting (10 registrations per hour per IP)
    const rateLimitResult = await checkRateLimit(`register:${clientInfo.ip}`, 'STRICT')
    if (!rateLimitResult.success) {
      logAPI.error('POST', '/api/auth/register', new Error('Rate limit exceeded'), { ip: clientInfo.ip })
      return NextResponse.json(
        {
          success: false,
          error: 'Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau.',
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
    const validation = validateRequest(registerSchema, body)
    if (!validation.success) {
      logAPI.error('POST', '/api/auth/register', new Error('Validation failed'), { errors: validation.errors })
      return NextResponse.json(
        {
          success: false,
          error: 'Dữ liệu không hợp lệ',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const { fullName, email, phone, password, guestId, role } = validation.data as any
    const sanitizedName = sanitizeString(fullName)

    // Use validated role (defaults to CUSTOMER)
    const userRole = role || 'CUSTOMER'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email })
      return NextResponse.json(
        { success: false, error: 'Email này đã được đăng ký' },
        { status: 400 }
      )
    }

    // Hash password (increased rounds for better security)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Helper function to generate unique referral code
    const generateUniqueReferralCode = async (tx: any): Promise<string> => {
      let referralCode: string = ''
      let isUnique = false
      let attempts = 0
      const maxAttempts = 20

      while (!isUnique && attempts < maxAttempts) {
        // Generate referral code: first 3 chars of name + timestamp + random
        const namePart = sanitizedName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CUS'
        const timestamp = Date.now().toString(36).toUpperCase()
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
        referralCode = `${namePart}${timestamp}${randomPart}`

        // Check if code already exists
        const existing = await tx.customer.findFirst({
          where: { referralCode }
        })

        if (!existing) {
          isUnique = true
        } else {
          attempts++
          // Add small delay to ensure timestamp changes
          await new Promise(resolve => setTimeout(resolve, 1))
        }
      }

      if (!isUnique) {
        // Final fallback: use UUID-like format with timestamp
        referralCode = `REF${Date.now()}${Math.random().toString(36).substring(2, 11).toUpperCase()}${Math.floor(Math.random() * 10000)}`
      }

      return referralCode
    }

    // Create user and customer record
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          name: sanitizedName,
          email: email.toLowerCase(), // Store email in lowercase
          phone,
          role: userRole, // Use role from request
          password: hashedPassword
        }
      })

      // Generate unique referral code
      const referralCode = await generateUniqueReferralCode(tx)

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          referralCode
        }
      })

      // Migrate guest data if guestId provided
      if (guestId && guestId.startsWith('guest_')) {
        try {
          // Find conversations where guest was a participant
          const guestConversations = await tx.conversation.findMany({
            where: {
              OR: [
                { participant1Id: guestId },
                { participant2Id: guestId }
              ]
            }
          })

          // Update each conversation to use new customer ID
          for (const conv of guestConversations) {
            const updateData: any = {}
            if (conv.participant1Id === guestId) {
              updateData.participant1Id = customer.id
              updateData.participant1Name = sanitizedName
            }
            if (conv.participant2Id === guestId) {
              updateData.participant2Id = customer.id
              updateData.participant2Name = sanitizedName
            }

            await tx.conversation.update({
              where: { id: conv.id },
              data: updateData
            })
          }

          // Update messages from guest to new customer
          await tx.message.updateMany({
            where: { senderId: guestId },
            data: {
              senderId: customer.id,
              senderName: sanitizedName
            }
          })

          logger.info('Guest data migrated', {
            guestId,
            customerId: customer.id,
            conversationsCount: guestConversations.length
          })
        } catch (migrationError) {
          // Don't fail registration if migration fails
          logger.error('Guest migration failed', { guestId, error: migrationError })
        }
      }

      return { user, customer }
    })

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update user with OTP
    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        otpCode,
        otpExpiresAt
      }
    })

    // Send OTP via Email
    const emailSent = await EmailService.sendOTP({
      email: result.user.email,
      name: result.user.name,
      otpCode,
      type: 'VERIFICATION',
      expiresInMinutes: 10
    })

    if (!emailSent) {
      logger.error('Failed to send verification email', { email: result.user.email })
    }

    // Generate a temporary verification token (short-lived)
    const verificationToken = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        purpose: 'email_verification'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    const duration = Date.now() - startTime
    logAPI.response('POST', '/api/auth/register', 201, duration)

    return NextResponse.json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để nhận mã xác thực.',
      verificationRequired: true,
      email: result.user.email,
      verificationToken // Client can use this to identify the session
    }, { status: 201 })
  } catch (error: any) {
    const duration = Date.now() - startTime
    logAPI.error('POST', '/api/auth/register', error, { duration })
    logger.error('Registration error', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    })

    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      // Unique constraint violation
      const field = error.meta?.target?.[0] || 'field'
      if (field === 'referralCode') {
        logger.error('Referral code uniqueness violation - this should not happen', { error: error.message })
        return NextResponse.json(
          {
            success: false,
            error: 'Đăng ký thất bại do lỗi hệ thống. Vui lòng thử lại.'
          },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { success: false, error: `${field === 'email' ? 'Email' : field} đã được đăng ký` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Đã xảy ra lỗi. Vui lòng thử lại.'
      },
      { status: 500 }
    )
  }
}