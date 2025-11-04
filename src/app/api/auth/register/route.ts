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

      const customer = await tx.customer.create({
        data: {
          userId: user.id
        }
      })

      return { user, customer }
    })

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: result.user.id, 
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

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token
    }, { status: 201 })
  } catch (error: any) {
    const duration = Date.now() - startTime
    logAPI.error('POST', '/api/auth/register', error, { duration })
    logger.error('Registration error', { error: error.message, stack: error.stack })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}