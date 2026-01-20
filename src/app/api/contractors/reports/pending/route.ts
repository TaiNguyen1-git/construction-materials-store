/**
 * Contractor Reports Management API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })

        const customer = await prisma.customer.findFirst({ where: { userId: payload.userId } })
        if (!customer) return NextResponse.json(createErrorResponse('Customer not found', 'NOT_FOUND'), { status: 404 })

        const pendingReports = await (prisma as any).workerReport.findMany({
            where: {
                contractorId: customer.id,
                status: 'PENDING'
            },
            include: { project: true },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(pendingReports))
    } catch (error) {
        return NextResponse.json(createErrorResponse('Lỗi tải báo cáo', 'SERVER_ERROR'), { status: 500 })
    }
}
