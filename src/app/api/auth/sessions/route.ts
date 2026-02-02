import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

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

// Hash token for comparison
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

// GET: List all active sessions for current user
export async function GET(request: NextRequest) {
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

        const currentTokenHash = hashToken(token)

        // Get all active sessions for this user
        const sessions = await prisma.userSession.findMany({
            where: {
                userId: tokenData.userId,
                isActive: true,
                expiresAt: { gt: new Date() }
            },
            select: {
                id: true,
                deviceInfo: true,
                ipAddress: true,
                lastActivityAt: true,
                createdAt: true,
                tokenHash: true,
            },
            orderBy: { lastActivityAt: 'desc' }
        })

        // Transform sessions and mark current
        const sessionsWithCurrent = sessions.map(session => ({
            id: session.id,
            deviceInfo: session.deviceInfo || 'Thiết bị không xác định',
            ipAddress: session.ipAddress || 'IP không xác định',
            lastActivityAt: session.lastActivityAt,
            createdAt: session.createdAt,
            isCurrent: session.tokenHash === currentTokenHash,
        }))

        return NextResponse.json({
            success: true,
            sessions: sessionsWithCurrent,
        })
    } catch (error: unknown) {
        console.error('[Sessions List] Error:', error)

        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
            { status: 500 }
        )
    }
}
