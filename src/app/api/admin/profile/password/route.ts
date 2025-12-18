import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import { AuthService } from '@/lib/auth'

// PUT /api/admin/profile/password - Change password
export async function PUT(request: NextRequest) {
    try {
        const auth = verifyTokenFromRequest(request)

        if (!auth || !auth.userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { currentPassword, newPassword } = body

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, error: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
                { status: 400 }
            )
        }

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: auth.userId }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            )
        }

        // Verify current password
        const isValidPassword = await AuthService.verifyPassword(currentPassword, user.password)

        if (!isValidPassword) {
            return NextResponse.json(
                { success: false, error: 'Mật khẩu hiện tại không đúng' },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await AuthService.hashPassword(newPassword)

        // Update password
        await prisma.user.update({
            where: { id: auth.userId },
            data: { password: hashedPassword }
        })

        console.log('Password changed for user:', auth.userId)

        return NextResponse.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        })

    } catch (error: any) {
        console.error('Change password error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
