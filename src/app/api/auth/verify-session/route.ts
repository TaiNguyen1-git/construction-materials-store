/**
 * API Route: Verify Session
 * 
 * Validates the provided access token and returns session status.
 * Used by new tabs to verify if a shared session is still valid.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { accessToken } = body

        if (!accessToken) {
            return NextResponse.json(
                { valid: false, error: 'Token không được cung cấp' },
                { status: 400 }
            )
        }

        // Verify the token
        let payload
        try {
            payload = AuthService.verifyAccessToken(accessToken)
        } catch (error) {
            return NextResponse.json(
                { valid: false, error: 'Token không hợp lệ hoặc đã hết hạn' },
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

        // Session is valid
        return NextResponse.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        })
    } catch (error) {
        console.error('[Verify Session] Error:', error)
        return NextResponse.json(
            { valid: false, error: 'Lỗi hệ thống' },
            { status: 500 }
        )
    }
}
