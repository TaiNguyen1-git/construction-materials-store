/**
 * API Route: Verify Session
 * 
 * Validates the provided access token (from cookies) and returns session status.
 * Used by new tabs to verify if a shared session is still valid and active.
 * Implements Session Revocation (checking DB for session status).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import crypto from 'crypto'

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
    try {
        // Read access token from cookies (HttpOnly)
        // Check portal-specific cookies FIRST, then fall back to generic auth_token
        // This prevents reading stale auth_token when a newer portal cookie exists
        const accessToken = request.cookies.get('admin_token')?.value
            || request.cookies.get('contractor_token')?.value
            || request.cookies.get('supplier_token')?.value
            || request.cookies.get('auth_token')?.value

        if (!accessToken) {
            return NextResponse.json(
                { valid: false, error: 'Phiên làm việc đã hết hạn hoặc không tồn tại' },
                { status: 401 }
            )
        }

        // Verify the token integrity
        let payload
        try {
            payload = AuthService.verifyAccessToken(accessToken)
        } catch (error) {
            return NextResponse.json(
                { valid: false, error: 'Token không hợp lệ hoặc đã hết hạn' },
                { status: 401 }
            )
        }

        // 🛡️ SESSION REVOCATION CHECK: Check if session exists and is active in DB
        const tokenHash = hashToken(accessToken)
        const session = await prisma.userSession.findFirst({
            where: {
                userId: payload.userId,
                tokenHash: tokenHash,
                isActive: true,
                expiresAt: { gt: new Date() }
            },
        })

        if (!session) {
            return NextResponse.json(
                { valid: false, error: 'Phiên làm việc đã bị thu hồi hoặc hết hạn' },
                { status: 401 }
            )
        }

        // Check if user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                emailVerified: true,
                isActive: true,
                hasSetTwoFactor: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { valid: false, error: 'Người dùng không tồn tại' },
                { status: 401 }
            )
        }

        if (!user.isActive) {
            return NextResponse.json(
                { valid: false, error: 'Tài khoản đã bị vô hiệu hóa' },
                { status: 401 }
            )
        }

        // Update session's last activity
        await prisma.userSession.update({
            where: { id: session.id },
            data: { lastActivityAt: new Date() }
        })

        // Session is valid
        return NextResponse.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            needs2FASetupPrompt: !user.hasSetTwoFactor,
        })
    } catch (error) {
        console.error('[Verify Session] Error:', error)
        return NextResponse.json(
            { valid: false, error: 'Lỗi hệ thống' },
            { status: 500 }
        )
    }
}
