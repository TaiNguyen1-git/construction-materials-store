import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

interface RouteParams {
    params: Promise<{ id: string }>
}

// DELETE: Revoke a specific session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: sessionId } = await params
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

        // Find the session
        const session = await prisma.userSession.findUnique({
            where: { id: sessionId }
        })

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Phiên không tồn tại' },
                { status: 404 }
            )
        }

        // Ensure user can only revoke their own sessions
        if (session.userId !== tokenData.userId) {
            return NextResponse.json(
                { success: false, error: 'Không có quyền thực hiện' },
                { status: 403 }
            )
        }

        // Invalidate the session
        await prisma.userSession.update({
            where: { id: sessionId },
            data: { isActive: false }
        })

        return NextResponse.json({
            success: true,
            message: 'Đã thu hồi phiên thành công'
        })
    } catch (error: unknown) {
        console.error('[Session Revoke] Error:', error)

        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
            { status: 500 }
        )
    }
}
