import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { authenticator } from 'otplib'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supplier-secret-key-change-in-production'

export async function POST(request: NextRequest) {
    try {
        const { supplierId, code } = await request.json()

        if (!supplierId || !code) {
            return NextResponse.json(
                createErrorResponse('ID và mã xác thực là bắt buộc', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            include: { user: true }
        })

        if (!supplier) {
            return NextResponse.json(
                createErrorResponse('Nhà cung cấp không tồn tại', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Get secret from supplier or linked user
        const secret = (supplier as any).twoFactorSecret || (supplier.user as any)?.twoFactorSecret

        if (!secret) {
            return NextResponse.json(
                createErrorResponse('2FA chưa được thiết lập cho tài khoản này', 'AUTH_ERROR'),
                { status: 400 }
            )
        }

        const isValid = authenticator.verify({ token: code, secret })

        if (!isValid) {
            return NextResponse.json(
                createErrorResponse('Mã xác thực không chính xác hoặc đã hết hạn', 'AUTH_ERROR'),
                { status: 401 }
            )
        }

        const mustChangePassword = (supplier as any).mustChangePassword || (supplier.user as any)?.mustChangePassword || false

        // Generate token upon successful 2FA
        const token = jwt.sign(
            {
                supplierId: supplier.id,
                userId: supplier.id,
                email: supplier.email,
                role: 'SUPPLIER',
                type: 'supplier',
                mustChangePassword
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        return NextResponse.json(
            createSuccessResponse({
                token,
                supplier: {
                    id: supplier.id,
                    name: supplier.name,
                    email: supplier.email,
                    phone: supplier.phone,
                    mustChangePassword
                }
            }, 'Mã xác thực chính xác! Đăng nhập thành công'),
            { status: 200 }
        )
    } catch (error: any) {
        console.error('2FA Verify error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
