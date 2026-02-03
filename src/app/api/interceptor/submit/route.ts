
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

/**
 * Handle user actions on system interceptor modals:
 * - SEEN (Feature Tour)
 * - ACCEPTED (Policy)
 * - DISMISSED
 * - FEEDBACK_SUBMIT (Review)
 */
export async function POST(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const text = await request.text();
        if (!text) {
            return NextResponse.json(createErrorResponse('Empty body', 'BAD_REQUEST'), { status: 400 });
        }
        const body = JSON.parse(text);
        const { announcementId, action, data } = body

        // 1. Record the action for General Announcements
        if (announcementId) {
            await (prisma as any).userAnnouncementAction.upsert({
                where: {
                    userId_announcementId: {
                        userId: payload.userId,
                        announcementId
                    }
                },
                update: { action },
                create: {
                    userId: payload.userId,
                    announcementId,
                    action
                }
            })
        }

        // 2. Specialized Actions
        if (action === 'FEEDBACK_SUBMIT' && data?.orderId) {
            // Logic to create ProductReview for items in order
            const order = await prisma.order.findUnique({
                where: { id: data.orderId },
                include: { orderItems: true }
            })

            if (order && order.customerId) {
                // Create review for the first item as MVP or for all
                for (const item of order.orderItems) {
                    await (prisma as any).productReview.upsert({
                        where: {
                            productId_customerId_orderId: {
                                productId: item.productId,
                                customerId: order.customerId,
                                orderId: order.id
                            }
                        },
                        update: { rating: data.rating || 5, review: data.review || '' },
                        create: {
                            productId: item.productId,
                            customerId: order.customerId,
                            orderId: order.id,
                            rating: data.rating || 5,
                            review: data.review || '',
                            isVerified: true
                        }
                    })
                }
            }
        }

        return NextResponse.json(createSuccessResponse({ success: true }))

    } catch (error) {
        console.error('Interceptor Submit Error:', error)
        return NextResponse.json(createErrorResponse('Lỗi xử lý hệ thống', 'SERVER_ERROR'), { status: 500 })
    }
}
