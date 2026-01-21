/**
 * API: Update User Profile
 * PATCH /api/auth/update-profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

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

        const { name, phone, address } = await request.json()

        // Validate input
        if (!name || !name.trim()) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng nhập họ tên' },
                { status: 400 }
            )
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: payload.userId },
            data: {
                name: name.trim(),
                phone: phone?.trim() || null,
                address: address?.trim() || null
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

    } catch (error: any) {
        console.error('Update profile error:', error)
        return NextResponse.json(
            { success: false, error: 'Lỗi server. Vui lòng thử lại sau.' },
            { status: 500 }
        )
    }
}
