import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { registerSchema, validateRequest, sanitizeString } from '@/lib/validation'
import { logger, logAuth, logAPI } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // Validate with Zod
    const validation = validateRequest(registerSchema, body)
    if (!validation.success) {
      logAPI.error('POST', '/api/auth/register', new Error('Validation failed'), { errors: validation.errors })
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const { fullName, email, phone, password } = validation.data
    const sanitizedName = sanitizeString(fullName)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email })
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
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
          role: 'CUSTOMER',
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

      return { user, customer }
    })

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Log successful registration
    logAuth.login(result.user.id, result.user.email, true)
    logger.info('New user registered', {
      userId: result.user.id,
      email: result.user.email,
      type: 'auth'
    })

    // Return user data without password
    const { password: _, ...userWithoutPassword } = result.user

    const duration = Date.now() - startTime
    logAPI.response('POST', '/api/auth/register', 201, duration)

    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token
    }, { status: 201 })

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
        // Retry logic could be added here, but for now just return error
        return NextResponse.json(
          {
            success: false,
            error: 'Registration failed due to a system error. Please try again.'
          },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { success: false, error: `This ${field} is already registered` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error'
      },
      { status: 500 }
    )
  }
}