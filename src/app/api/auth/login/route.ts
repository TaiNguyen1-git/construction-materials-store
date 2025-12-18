import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { loginSchema, validateRequest } from '@/lib/validation'
import { logger, logAuth, logAPI } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // Validate with Zod
    const validation = validateRequest(loginSchema, body)
    if (!validation.success) {
      logAPI.error('POST', '/api/auth/login', new Error('Validation failed'), { errors: validation.errors })
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      logAuth.failed(email, 'User not found')
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      logAuth.failed(email, 'Invalid password')
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Log successful login
    logAuth.login(user.id, user.email, true)

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    const duration = Date.now() - startTime
    logAPI.response('POST', '/api/auth/login', 200, duration)

    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token
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
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
