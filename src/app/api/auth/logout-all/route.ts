import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import jwt from 'jsonwebtoken'

// Helper to extract token from request
function getTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7)
    }

    // Try all portal-specific cookies
    const cookieToken = request.cookies.get('auth_token')?.value
        || request.cookies.get('admin_token')?.value
        || request.cookies.get('contractor_token')?.value
        || request.cookies.get('supplier_token')?.value
    if (cookieToken) {
        return cookieToken
    }

    return null
}

// Verify JWT and get user ID
function verifyToken(token: string): { userId: string } | null {
    try {
        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not configured')
        }

        const payload = jwt.verify(token, jwtSecret) as any
        return { userId: payload.userId }
    } catch {
        return null
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromRequest(request)

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Không có quyền truy cập' },
                { status: 401 }
            )
        }

        const tokenData = verifyToken(token)
        if (!tokenData) {
            return NextResponse.json(
                { success: false, error: 'Token không hợp lệ' },
                { status: 401 }
            )
        }

        // Invalidate ALL sessions for this user
        const result = await prisma.userSession.updateMany({
            where: {
                userId: tokenData.userId,
                isActive: true
            },
            data: { isActive: false }
        })

        const response = NextResponse.json({
            success: true,
            message: 'Đã đăng xuất khỏi tất cả thiết bị',
            sessionsInvalidated: result.count
        })

        // Clear all auth cookies
        AuthService.clearAuthCookies(response)

        return response
    } catch (error: unknown) {
        console.error('[Logout All] Error:', error)

        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
            { status: 500 }
        )
    }
}
