import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// GET /api/admin/profile - Get current user profile
export async function GET(request: NextRequest) {
    try {
        const auth = verifyTokenFromRequest(request)

        if (!auth || !auth.userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: user
        })

    } catch (error: any) {
        console.error('Get profile error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/admin/profile - Update user profile
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
        const { name, email, phone, address } = body

        if (!name || !email) {
            return NextResponse.json(
                { success: false, error: 'Tên và email là bắt buộc' },
                { status: 400 }
            )
        }

        // Check if email is already taken by another user
        const existingUser = await prisma.user.findFirst({
            where: {
                email: email.toLowerCase().trim(),
                id: { not: auth.userId }
            }
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email đã được sử dụng bởi tài khoản khác' },
                { status: 400 }
            )
        }

        const updatedUser = await prisma.user.update({
            where: { id: auth.userId },
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                phone: phone?.trim() || null,
                address: address?.trim() || null
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                role: true
            }
        })

        return NextResponse.json({
            success: true,
            data: updatedUser,
            message: 'Profile updated successfully'
        })

    } catch (error: any) {
        console.error('Update profile error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
