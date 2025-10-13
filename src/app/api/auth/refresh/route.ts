import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService, JWTPayload } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = refreshSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { refreshToken } = validation.data

    // Verify refresh token
    let payload: JWTPayload
    try {
      payload = AuthService.verifyRefreshToken(refreshToken)
    } catch (error) {
      return NextResponse.json(
        createErrorResponse('Invalid refresh token', 'INVALID_TOKEN'),
        { status: 401 }
      )
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        createErrorResponse('User not found or inactive', 'USER_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const tokens = AuthService.generateTokenPair({
      userId: tokenPayload.userId,
      email: tokenPayload.email,
      role: tokenPayload.role as any
    })

    return NextResponse.json(
      createSuccessResponse(tokens, 'Tokens refreshed successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}