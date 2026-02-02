import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
    try {
        const decoded = await verifyTokenFromRequest(request)
        const supplierId = (decoded as any)?.supplierId || decoded?.userId

        if (!supplierId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId }
        })

        if (!supplier) {
            return NextResponse.json(createErrorResponse('Supplier not found', 'NOT_FOUND'), { status: 404 })
        }

        // Generate a new secret if not exists or if requested
        const secret = authenticator.generateSecret()
        const otpauth = authenticator.keyuri(
            supplier.email || 'supplier',
            'SmartBuild Supplier',
            secret
        )

        const qrCodeUrl = await QRCode.toDataURL(otpauth)

        // Save temporary secret? No, we will save it only when verified
        // For now, return it to the frontend to keep it in state

        return NextResponse.json(createSuccessResponse({
            secret,
            qrCodeUrl,
            otpauth
        }))

    } catch (error: any) {
        console.error('2FA Setup error:', error)
        return NextResponse.json(createErrorResponse('Lỗi hệ thống', 'SERVER_ERROR'), { status: 500 })
    }
}

// POST to enable 2FA after verification
export async function POST(request: NextRequest) {
    try {
        const decoded = await verifyTokenFromRequest(request)
        const supplierId = (decoded as any)?.supplierId || decoded?.userId
        const { secret, code } = await request.json()

        if (!supplierId || !secret || !code) {
            return NextResponse.json(createErrorResponse('Missing required fields', 'VALIDATION_ERROR'), { status: 400 })
        }

        const isValid = authenticator.verify({ token: code, secret })

        if (!isValid) {
            return NextResponse.json(createErrorResponse('Mã xác thực không chính xác', 'AUTH_ERROR'), { status: 400 })
        }

        // Enable 2FA in DB
        await prisma.supplier.update({
            where: { id: supplierId },
            data: {
                twoFactorSecret: secret,
                is2FAEnabled: true,
                hasSetTwoFactor: true
            } as any
        })

        return NextResponse.json(createSuccessResponse(null, 'Đã kích hoạt bảo mật 2 lớp thành công!'))

    } catch (error: any) {
        console.error('2FA Enable error:', error)
        return NextResponse.json(createErrorResponse('Lỗi hệ thống', 'SERVER_ERROR'), { status: 500 })
    }
}
