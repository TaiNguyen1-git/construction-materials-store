import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function POST(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        await prisma.user.update({
            where: { id: payload.userId },
            data: { hasSetTwoFactor: true } as any
        })

        return NextResponse.json(createSuccessResponse(null, 'Đã ẩn yêu cầu 2FA'))
    } catch (error) {
        console.error('Dismiss 2FA Prompt Error:', error)
        return NextResponse.json(createErrorResponse('Internal Server Error', 'INTERNAL_ERROR'), { status: 500 })
    }
}
