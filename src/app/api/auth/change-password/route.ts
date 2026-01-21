/**
 * API: Change Password (for logged-in users)
 * POST /api/auth/change-password
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function POST(request: NextRequest) {
    try {
        // Verify token
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng đăng nhập để thực hiện' },
                { status: 401 }
            )
        }

        const { currentPassword, newPassword } = await request.json()

        // Validate input
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng nhập đầy đủ mật khẩu' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
                { status: 400 }
            )
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: payload.userId }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy tài khoản' },
                { status: 404 }
            )
        }

        // Verify current password
        const isPasswordValid = await AuthService.verifyPassword(currentPassword, user.password)
        if (!isPasswordValid) {
            return NextResponse.json(
                { success: false, error: 'Mật khẩu hiện tại không đúng' },
                { status: 400 }
            )
        }

        // Check if new password is same as current
        const isSamePassword = await AuthService.verifyPassword(newPassword, user.password)
        if (isSamePassword) {
            return NextResponse.json(
                { success: false, error: 'Mật khẩu mới phải khác mật khẩu hiện tại' },
                { status: 400 }
            )
        }

        // Hash new password and update
        const hashedPassword = await AuthService.hashPassword(newPassword)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                mustChangePassword: false // Clear flag if any
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        })

    } catch (error: any) {
        console.error('Change password error:', error)
        return NextResponse.json(
            { success: false, error: 'Lỗi server. Vui lòng thử lại sau.' },
            { status: 500 }
        )
    }
}
