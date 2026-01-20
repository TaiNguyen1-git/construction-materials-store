/**
 * Generate Magic Link Token for Worker Reporting
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const payload = verifyTokenFromRequest(request)

        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Customer not found', 'NOT_FOUND'), { status: 404 })
        }

        // Generate a random token
        const token = uuidv4().replace(/-/g, '').substring(0, 12)

        const reportToken = await (prisma as any).projectReportToken.create({
            data: {
                token,
                projectId,
                contractorId: customer.id,
                isActive: true
            }
        })

        return NextResponse.json(
            createSuccessResponse({
                token: reportToken.token,
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/report/${reportToken.token}`
            }, 'Đã tạo link báo cáo thành công')
        )
    } catch (error) {
        console.error('Create report token error:', error)
        return NextResponse.json(createErrorResponse('Lỗi tạo link', 'SERVER_ERROR'), { status: 500 })
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const payload = verifyTokenFromRequest(request)

        if (!payload?.userId) return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })

        const customer = await prisma.customer.findFirst({ where: { userId: payload.userId } })
        if (!customer) return NextResponse.json(createErrorResponse('Customer not found', 'NOT_FOUND'), { status: 404 })

        const tokens = await (prisma as any).projectReportToken.findMany({
            where: {
                projectId,
                contractorId: customer.id,
                isActive: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(
            createSuccessResponse({
                tokens: tokens.map((t: any) => ({
                    token: t.token,
                    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/report/${t.token}`,
                    createdAt: t.createdAt
                }))
            }, 'Danh sách link báo cáo')
        )
    } catch (error) {
        return NextResponse.json(createErrorResponse('Lỗi tải link', 'SERVER_ERROR'), { status: 500 })
    }
}
