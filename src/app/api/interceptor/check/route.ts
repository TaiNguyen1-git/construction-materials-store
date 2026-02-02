
// Interceptor API to check for mandatory blocking conditions
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(request: NextRequest) {
    try {
        const payload = await verifyTokenFromRequest(request)
        const userId = payload?.userId
        const { searchParams } = new URL(request.url)
        const isSummaryMode = searchParams.get('summary') === 'true'

        const now = new Date()

        // 1. Check System Announcements
        const systemAnnouncement = (prisma as any).systemAnnouncement;

        if (isSummaryMode) {
            if (!systemAnnouncement) {
                return NextResponse.json(createSuccessResponse({ isSummary: true, items: [] }))
            }

            const allActive = await systemAnnouncement.findMany({
                where: {
                    isActive: true,
                    startTime: { lte: now },
                    OR: [
                        { endTime: { gte: now } },
                        { endTime: null }
                    ],
                    targetPath: { not: null }
                },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    targetPath: true,
                    displayMode: true
                }
            })

            return NextResponse.json(createSuccessResponse({
                isSummary: true,
                items: allActive
            }))
        }

        // NORMAL MODE: Return single most important blocker
        const activeAnnouncement = systemAnnouncement ? await systemAnnouncement.findFirst({
            where: {
                isActive: true,
                startTime: { lte: now },
                OR: [
                    { endTime: { gte: now } },
                    { endTime: null }
                ],
                ...(userId ? {
                    OR: [
                        { type: 'MAINTENANCE' },
                        {
                            announcementActions: {
                                none: { userId, action: { in: ['SEEN', 'ACCEPTED'] } }
                            }
                        }
                    ]
                } : {})
            },
            orderBy: [
                { createdAt: 'desc' }
            ]
        }) : null

        if (activeAnnouncement) {
            return NextResponse.json(createSuccessResponse({
                type: activeAnnouncement.type,
                data: activeAnnouncement
            }))
        }

        if (!userId) {
            return NextResponse.json(createSuccessResponse(null))
        }

        // 2. Check Debt / Credit Hold
        const customer = await prisma.customer.findFirst({
            where: { userId }
        })

        if (customer?.creditHold) {
            return NextResponse.json(createSuccessResponse({
                type: 'DEBT_LOCK',
                data: {
                    amount: customer.overdueAmount,
                    days: customer.maxOverdueDays,
                    message: `Tài khoản tạm khóa do dư nợ ${customer.overdueAmount.toLocaleString()}đ quá hạn ${customer.maxOverdueDays} ngày.`
                }
            }))
        }

        // 3. Check Pending Feedback
        if (customer) {
            const recentOrder = await prisma.order.findFirst({
                where: {
                    customerId: customer.id,
                    status: 'DELIVERED',
                    updatedAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                },
                orderBy: { updatedAt: 'desc' }
            })

            if (recentOrder) {
                const productReview = (prisma as any).productReview;
                const review = productReview ? await productReview.findFirst({
                    where: { orderId: recentOrder.id }
                }) : true;

                if (!review) {
                    return NextResponse.json(createSuccessResponse({
                        type: 'FEEDBACK',
                        data: {
                            message: `Đơn hàng #${recentOrder.orderNumber} đã hoàn thành. Bạn hài lòng chứ?`,
                            orderId: recentOrder.id
                        }
                    }))
                }
            }
        }

        return NextResponse.json(createSuccessResponse(null))

    } catch (error: any) {
        console.error('Interceptor Check Error:', error)
        return NextResponse.json(createErrorResponse(
            process.env.NODE_ENV === 'development' ? error.message : 'Lỗi kiểm tra hệ thống'
        ), { status: 500 })
    }
}
