import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { EmailService } from '@/lib/email-service'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
    try {
        const { verificationToken } = await request.json()

        if (!verificationToken) {
            return NextResponse.json(
                { success: false, error: 'Thiếu token xác thực' },
                { status: 400 }
            )
        }

        // Verify verification token
        let decoded: any
        try {
            decoded = jwt.verify(verificationToken, process.env.JWT_SECRET!)
        } catch (err) {
            return NextResponse.json(
                { success: false, error: 'Phiên xác thực đã hết hạn. Vui lòng thử lại.' },
                { status: 401 }
            )
        }

        const userId = decoded.userId

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Người dùng không tồn tại' },
                { status: 404 }
            )
        }

        // Generate NEW 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

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
            type: decoded.purpose === '2fa' ? '2FA' : 'VERIFICATION',
            expiresInMinutes: 10
        })

        if (!emailSent) {
            return NextResponse.json(
                { success: false, error: 'Không thể gửi email. Vui lòng kiểm tra lại.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Mã xác thực mới đã được gửi đến email của bạn.'
        })

    } catch (error: any) {
        console.error('Resend OTP error:', error)
        return NextResponse.json(
            { success: false, error: 'Lỗi hệ thống' },
            { status: 500 }
        )
    }
}
