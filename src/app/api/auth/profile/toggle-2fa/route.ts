import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import { EmailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { enabled, otp } = await request.json()

        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        })

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
        }

        if (enabled) {
            // Turning ON 2FA requires OTP verification
            if (!otp) {
                // Generate and send OTP
                const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
                const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

                await prisma.user.update({
                    where: { id: user.id },
                    data: { otpCode, otpExpiresAt }
                })

                await EmailService.sendOTP({
                    email: user.email,
                    name: user.name,
                    otpCode,
                    type: '2FA',
                    expiresInMinutes: 10
                })

                return NextResponse.json({ success: true, requiresOtp: true })
            }

            // Verify OTP
            if (user.otpCode !== otp || (user.otpExpiresAt && user.otpExpiresAt < new Date())) {
                return NextResponse.json({ success: false, error: 'Mã OTP không chính xác hoặc đã hết hạn' }, { status: 400 })
            }

            // Success
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    is2FAEnabled: true,
                    hasSetTwoFactor: true,
                    otpCode: null,
                    otpExpiresAt: null
                } as any
            })

            return NextResponse.json({ success: true, message: 'Đã kích hoạt xác thực 2 lớp' })
        } else {
            // Turning OFF 2FA
            await prisma.user.update({
                where: { id: user.id },
                data: { is2FAEnabled: false, hasSetTwoFactor: true } as any
            })

            return NextResponse.json({ success: true, message: 'Đã tắt xác thực 2 lớp' })
        }
    } catch (error) {
        console.error('Toggle 2FA Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
