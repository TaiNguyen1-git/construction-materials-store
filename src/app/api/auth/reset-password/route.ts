import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import crypto from 'crypto'

// POST /api/auth/reset-password - Reset password with token
export async function POST(request: NextRequest) {
    try {
        const { token, email, newPassword } = await request.json()

        if (!token || !newPassword) {
            return NextResponse.json(
                { success: false, error: 'Token và mật khẩu mới là bắt buộc' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' },
                { status: 400 }
            )
        }

        // Hash the token to compare
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

        // Find user with valid token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: tokenHash,
                ...(email ? { email: email.toLowerCase().trim() } : {}),
                resetTokenExpiry: {
                    gt: new Date()
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.' },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await AuthService.hashPassword(newPassword)

        // Update user password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        })

        console.log('Password reset successful for:', email)

        return NextResponse.json({
            success: true,
            message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.'
        })

    } catch (error: any) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
