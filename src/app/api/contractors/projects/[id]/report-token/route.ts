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

        // If projectId is 'active', find the most recent active project for this contractor
        let resolvedProjectId = projectId

        if (projectId === 'active') {
            // Priority 1: Self-created projects
            const ownedProject = await prisma.constructionProject.findFirst({
                where: {
                    customerId: customer.id,
                    status: { not: 'CLOSED' }
                },
                orderBy: { updatedAt: 'desc' }
            })

            if (ownedProject) {
                resolvedProjectId = ownedProject.id
            } else {
                // Priority 2: Assigned projects (via applications)
                const assignedApp = await prisma.projectApplication.findFirst({
                    where: {
                        contractorId: customer.id,
                        status: 'ACCEPTED',
                        project: {
                            status: { not: 'CLOSED' }
                        }
                    },
                    include: { project: true },
                    orderBy: { updatedAt: 'desc' }
                })

                if (assignedApp) {
                    resolvedProjectId = assignedApp.projectId
                } else {
                    return NextResponse.json(createErrorResponse(
                        'Bạn chưa có dự án nào đang hoạt động (tự tạo hoặc được giao).',
                        'NO_ACTIVE_PROJECT',
                        { hint: 'Hãy tạo dự án mới hoặc chờ duyệt vào dự án.' }
                    ), { status: 400 })
                }
            }
        }

        // Generate a random token
        const token = uuidv4().replace(/-/g, '').substring(0, 12)

        const reportToken = await (prisma as any).projectReportToken.create({
            data: {
                token,
                projectId: resolvedProjectId,
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

        const query: any = {
            contractorId: customer.id,
            isActive: true
        }

        if (projectId !== 'active') {
            query.projectId = projectId
        }

        const tokens = await (prisma as any).projectReportToken.findMany({
            where: query,
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
