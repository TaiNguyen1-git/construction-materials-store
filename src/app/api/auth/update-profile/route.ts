/**
 * API: Update User Profile
 * PATCH /api/auth/update-profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import jwt, { JwtPayload } from 'jsonwebtoken'

interface ProfileUpdatePayload extends JwtPayload {
    userId: string
    purpose: string
}

export async function PATCH(request: NextRequest) {
    try {
        // Verify token
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng đăng nhập để thực hiện' },
                { status: 401 }
            )
        }

        const { name, phone, address, otp, updateToken } = await request.json()

        // Validate basic input
        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng nhập họ tên' },
                { status: 400 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: payload.userId }
        })

        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy người dùng' }, { status: 404 })
        }

        // Check if phone is being changed
        const isPhoneChanged = phone && phone.trim() !== currentUser.phone

        if (isPhoneChanged) {
            // Require OTP for phone change
            if (!otp || !updateToken) {
                return NextResponse.json(
                    { success: false, error: 'Xác thực OTP là bắt buộc để thay đổi số điện thoại', requiresOtp: true },
                    { status: 400 }
                )
            }

            // Verify OTP
            if (currentUser.otpCode !== otp || (currentUser.otpExpiresAt && currentUser.otpExpiresAt < new Date())) {
                return NextResponse.json(
                    { success: false, error: 'Mã OTP không chính xác hoặc đã hết hạn' },
                    { status: 400 }
                )
            }

            try {
                const decoded = jwt.verify(updateToken, process.env.JWT_SECRET!) as ProfileUpdatePayload
                if (decoded.userId !== currentUser.id || decoded.purpose !== 'profile_update') {
                    throw new Error('Invalid token')
                }
            } catch {
                return NextResponse.json(
                    { success: false, error: 'Phiên làm việc không hợp lệ' },
                    { status: 401 }
                )
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: payload.userId },
            data: {
                name: name.trim(),
                phone: phone?.trim() || null,
                address: address?.trim() || null,
                // Clear OTP if used
                ...(isPhoneChanged ? { otpCode: null, otpExpiresAt: null } : {})
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                createdAt: true
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            user: updatedUser
        })

    } catch (error: unknown) {
        console.error('Update profile error:', error)
        return NextResponse.json(
            { success: false, error: 'Lỗi server. Vui lòng thử lại sau.' },
            { status: 500 }
        )
    }
}
