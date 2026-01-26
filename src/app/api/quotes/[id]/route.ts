import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { saveNotificationForUser } from '@/lib/notification-service'

// GET /api/quotes/[id] - Get quote details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: quoteId } = await params
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const quote = await prisma.quoteRequest.findUnique({
            where: { id: quoteId },
            include: {
                items: true,
                milestones: {
                    orderBy: { order: 'asc' }
                },
                customer: { include: { user: { select: { name: true, email: true } } } },
                contractor: { include: { user: { select: { name: true, email: true } } } },
                history: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        quote: false
                    }
                }
            }
        })

        if (!quote) {
            return NextResponse.json(createErrorResponse('Yêu cầu báo giá không tồn tại', 'NOT_FOUND'), { status: 404 })
        }

        return NextResponse.json(createSuccessResponse(quote))
    } catch (error: any) {
        console.error('Get quote error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ nội bộ', 'INTERNAL_ERROR'), { status: 500 })
    }
}

const quoteItemSchema = z.object({
    description: z.string(),
    quantity: z.number(),
    unit: z.string(),
    unitPrice: z.number(),
    category: z.string().optional()
})

const milestoneSchema = z.object({
    name: z.string(),
    percentage: z.number(),
    description: z.string().optional()
})

const updateQuoteRequestSchema = z.object({
    status: z.enum(['REPLIED', 'ACCEPTED', 'REJECTED', 'CANCELLED']).optional(),
    action: z.enum(['REQUEST_OTP']).optional(), // For Flow 2
    response: z.string().optional(),
    priceQuote: z.number().optional(),
    items: z.array(quoteItemSchema).optional(), // Flow 1
    milestones: z.array(milestoneSchema).optional() // Flow 3
})

// PATCH /api/quotes/[id] - Update quote request
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: quoteId } = await params
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }
        const body = await request.json()
        const validation = updateQuoteRequestSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { status, action, response, priceQuote, items, milestones } = validation.data

        const customerProfile = await prisma.customer.findFirst({
            where: { userId },
            include: { user: true }
        })

        if (!customerProfile) {
            return NextResponse.json(createErrorResponse('Không tìm thấy thông tin thành viên', 'NOT_FOUND'), { status: 404 })
        }

        const quote = await prisma.quoteRequest.findUnique({
            where: { id: quoteId },
            include: {
                customer: { include: { user: true } },
                contractor: { include: { user: true } }
            }
        })

        if (!quote) {
            return NextResponse.json(createErrorResponse('Yêu cầu báo giá không tồn tại', 'NOT_FOUND'), { status: 404 })
        }

        const isCustomer = quote.customerId === customerProfile.id
        const isContractor = quote.contractorId === customerProfile.id

        if (!isCustomer && !isContractor) {
            return NextResponse.json(createErrorResponse('Bạn không có quyền thực hiện thao tác này', 'FORBIDDEN'), { status: 403 })
        }

        // Flow 2: Request OTP for Acceptance
        if (action === 'REQUEST_OTP') {
            if (!isCustomer) return NextResponse.json(createErrorResponse('Chỉ khách hàng mới có thể yêu cầu OTP', 'FORBIDDEN'), { status: 403 })

            const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

            await prisma.quoteRequest.update({
                where: { id: quoteId },
                data: { otpCode, otpExpiresAt }
            })

            // Mock Email Sending

            return NextResponse.json(createSuccessResponse({ expiresAt: otpExpiresAt }, 'Mã xác thực đã được gửi đến email của bạn'))
        }

        let updateData: any = {}
        let historyNotes = body.notes || ''

        // Contractor Responding/Revising (Flow 1, 3, 4)
        if (status === 'REPLIED') {
            if (!isContractor) return NextResponse.json(createErrorResponse('Chỉ nhà thầu mới có thể gửi báo giá', 'FORBIDDEN'), { status: 403 })

            const totalFromItems = items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || priceQuote || 0

            // Flow 4: Versioning - If already replied, create as NEW version
            if (quote.status === 'REPLIED' || quote.status === 'ACCEPTED') {
                const newVersion = await prisma.quoteRequest.create({
                    data: {
                        customerId: quote.customerId,
                        contractorId: quote.contractorId,
                        projectId: quote.projectId,
                        details: quote.details,
                        location: quote.location,
                        startDate: quote.startDate,
                        status: 'REPLIED',
                        response,
                        priceQuote: totalFromItems,
                        respondedAt: new Date(),
                        version: quote.version + 1,
                        parentQuoteId: quote.parentQuoteId || quote.id,
                        attachments: quote.attachments,
                        conversationId: quote.conversationId,
                        items: {
                            create: items?.map(item => ({
                                ...item,
                                totalPrice: item.quantity * item.unitPrice
                            }))
                        },
                        milestones: {
                            create: milestones?.map((m, idx) => ({
                                ...m,
                                order: idx + 1,
                                amount: (totalFromItems * m.percentage) / 100
                            }))
                        },
                        history: {
                            create: {
                                userId: customerProfile.userId,
                                newStatus: 'REPLIED',
                                notes: `Gửi phiên bản báo giá mới v${quote.version + 1}: ${totalFromItems.toLocaleString()}đ`
                            }
                        }
                    }
                })

                // Mark current as not latest
                await prisma.quoteRequest.update({
                    where: { id: quote.id },
                    data: { isLatest: false }
                })

                // Notify customer about new quote version
                try {
                    await saveNotificationForUser({
                        type: 'ORDER_UPDATE' as any,
                        priority: 'HIGH',
                        title: '📋 Báo giá mới từ nhà thầu',
                        message: `Nhà thầu ${quote.contractor.user.name || 'Nhà thầu'} đã gửi phiên bản báo giá mới v${quote.version + 1}: ${totalFromItems.toLocaleString()}đ`,
                        data: { quoteId: newVersion.id, priceQuote: totalFromItems }
                    }, quote.customer.userId, 'CUSTOMER')
                } catch (e) { console.error('Notify error:', e) }

                return NextResponse.json(createSuccessResponse(newVersion, 'Đã gửi phiên bản báo giá mới'))
            }

            // Initial Reply
            updateData = {
                status: 'REPLIED',
                response,
                priceQuote: totalFromItems,
                respondedAt: new Date(),
                items: {
                    create: items?.map(item => ({
                        ...item,
                        totalPrice: item.quantity * item.unitPrice
                    }))
                },
                milestones: {
                    create: milestones?.map((m, idx) => ({
                        ...m,
                        order: idx + 1,
                        amount: (totalFromItems * m.percentage) / 100
                    }))
                }
            }
            historyNotes = `Nhà thầu gửi báo giá chi tiết: ${totalFromItems.toLocaleString()}đ`

            // Notify customer about initial quote reply
            try {
                await saveNotificationForUser({
                    type: 'ORDER_UPDATE' as any,
                    priority: 'HIGH',
                    title: '📋 Nhà thầu đã gửi báo giá!',
                    message: `Nhà thầu ${quote.contractor.user.name || 'Nhà thầu'} đã gửi báo giá chi tiết: ${totalFromItems.toLocaleString()}đ. Vui lòng xem và phản hồi.`,
                    data: { quoteId, priceQuote: totalFromItems }
                }, quote.customer.userId, 'CUSTOMER')
            } catch (e) { console.error('Notify error:', e) }
        }

        // Customer Rejecting/Cancelling
        else if (status === 'REJECTED' || status === 'CANCELLED') {
            if (!isCustomer) return NextResponse.json(createErrorResponse('Bạn không có quyền này', 'FORBIDDEN'), { status: 403 })
            updateData = { status }
            historyNotes = status === 'REJECTED' ? 'Khách hàng từ chối báo giá' : 'Khách hàng hủy yêu cầu'

            // Notify contractor about customer decision
            try {
                const statusVi = status === 'REJECTED' ? 'từ chối' : 'hủy'
                await saveNotificationForUser({
                    type: 'ORDER_UPDATE' as any,
                    priority: 'MEDIUM',
                    title: status === 'REJECTED' ? '❌ Báo giá bị từ chối' : '🚫 Yêu cầu đã hủy',
                    message: `Khách hàng ${quote.customer.user.name || 'Khách hàng'} đã ${statusVi} yêu cầu báo giá.`,
                    data: { quoteId, status }
                }, quote.contractor.userId, 'CUSTOMER')
            } catch (e) { console.error('Notify error:', e) }
        }

        // 4. Update and Log
        const result = await prisma.quoteRequest.update({
            where: { id: quoteId },
            data: {
                ...updateData,
                history: {
                    create: {
                        userId: customerProfile.userId,
                        oldStatus: quote.status,
                        newStatus: status || quote.status,
                        notes: historyNotes
                    }
                }
            }
        })

        return NextResponse.json(createSuccessResponse(result, 'Cập nhật thành công'))

    } catch (error: any) {
        console.error('Update quote error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ nội bộ', 'INTERNAL_ERROR'), { status: 500 })
    }
}
