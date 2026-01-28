import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import crypto from 'crypto'

// Helper to hash token for lookup
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

// Helper to extract token from request
function getTokenFromRequest(request: NextRequest): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7)
    }

    // Try cookie
    const cookieToken = request.cookies.get('auth_token')?.value
    if (cookieToken) {
        return cookieToken
    }

    return null
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))
        const { sessionId } = body

        // Get token to find session
        const token = getTokenFromRequest(request)

        // Invalidate session in database
        if (sessionId) {
            // Invalidate specific session by ID
            await prisma.userSession.updateMany({
                where: { id: sessionId },
                data: { isActive: false }
            })
        } else if (token) {
            // Invalidate session by token hash
            const tokenHash = hashToken(token)
            await prisma.userSession.updateMany({
                where: { tokenHash },
                data: { isActive: false }
            })
        }

        const response = NextResponse.json({
            success: true,
            message: 'Đăng xuất thành công'
        })

        // Clear all auth cookies
        AuthService.clearAuthCookies(response)

        return response
    } catch (error: unknown) {
        console.error('[Logout] Error:', error)

        // Still clear cookies even if database operation fails
        const response = NextResponse.json({
            success: true,
            message: 'Đăng xuất thành công'
        })

        AuthService.clearAuthCookies(response)

        return response
    }
}
