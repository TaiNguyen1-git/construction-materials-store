import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { EmailService } from '@/lib/email-service'
import { logger } from '@/lib/logger'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function POST(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            )
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        // Update user with OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode,
                otpExpiresAt
            }
        })

        // Send OTP via Email
        const emailSent = await EmailService.sendOTP({
            email: user.email,
            name: user.name,
            otpCode,
            type: 'CHANGE_PROFILE',
            expiresInMinutes: 5
        })

        if (!emailSent) {
            return NextResponse.json(
                { success: false, error: 'Failed to send OTP' },
                { status: 500 }
            )
        }

        // Generate a short-lived profile update token
        const updateToken = jwt.sign(
            {
                userId: user.id,
                purpose: 'profile_update'
            },
            process.env.JWT_SECRET!,
            { expiresIn: '10m' }
        )

        return NextResponse.json({
            success: true,
            message: 'Mã xác thực đã được gửi đến email của bạn.',
            updateToken
        })

    } catch (error: unknown) {
        console.error('Request profile OTP error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
