import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService, UserRole } from '@/lib/auth'
import crypto from 'crypto'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token không tồn tại' },
        { status: 401 }
      )
    }

    // Verify refresh token
    let payload
    try {
      payload = AuthService.verifyRefreshToken(refreshToken)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Refresh token không hợp lệ hoặc đã hết hạn' },
        { status: 401 }
      )
    }

    // Find the original user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Người dùng không khả dụng' },
        { status: 401 }
      )
    }

    // Generate NEW token pair
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = AuthService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    })

    // Update session in DB
    const newTokenHash = hashToken(newAccessToken)

    // Find the most recent active session for this user to update
    const session = await prisma.userSession.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    if (session) {
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          tokenHash: newTokenHash,
          lastActivityAt: new Date()
        }
      })
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

    // Set new cookies
    AuthService.setAuthCookies(response, newAccessToken, newRefreshToken)

    return response
  } catch (error) {
    console.error('[Refresh Token] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}