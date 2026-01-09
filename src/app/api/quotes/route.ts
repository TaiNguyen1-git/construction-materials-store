import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { saveNotificationForUser } from '@/lib/notification-service'

const createQuoteRequestSchema = z.object({
    contractorId: z.string(),
    details: z.string().min(10, 'Mô tả cần chi tiết hơn'),
    budget: z.number().optional(),
    location: z.string().optional(),
    startDate: z.string().optional(), // ISO date string
    projectId: z.string().optional(),
    attachments: z.array(z.string()).optional()
})

// GET /api/quotes - List quotes for current user (either sent or received)
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'sent' or 'received'

        // Find customer record for this user
        const customer = await prisma.customer.findFirst({
            where: { userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Customer profile not found', 'NOT_FOUND'), { status: 404 })
        }

        let where: any = {}

        if (type === 'received') {
            // As a contractor viewing received requests
            where.contractorId = customer.id
        } else {
            // As a customer viewing sent requests (default)
            where.customerId = customer.id
        }

        // Fetch quotes using Prisma relations
        const quotes = await (prisma.quoteRequest as any).findMany({
            where,
            select: {
                id: true,
                customerId: true,
                contractorId: true,
                projectId: true,
                status: true,
                details: true,
                budget: true,
                location: true,
                startDate: true,
                response: true,
                priceQuote: true,
                respondedAt: true,
                createdAt: true,
                updatedAt: true,
                attachments: true,
                conversationId: true,
                history: {
                    select: {
                        id: true,
                        oldStatus: true,
                        newStatus: true,
                        notes: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                customer: {
                    select: {
                        id: true,
                        userId: true,
                        companyName: true,
                        user: {
                            select: { name: true, email: true, phone: true }
                        }
                    }
                },
                contractor: {
                    select: {
                        id: true,
                        userId: true,
                        companyName: true,
                        user: {
                            select: { name: true }
                        },
                        contractorProfile: {
                            select: {
                                trustScore: true,
                                totalProjectsCompleted: true,
                                avgRating: true
                            }
                        }
                    }
                },
                project: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(quotes))
    } catch (error: any) {
        console.error('Get quotes error:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
    }
}

// POST /api/quotes - Create new quote request
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const validation = createQuoteRequestSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { contractorId, details, budget, location, startDate, projectId, attachments } = validation.data

        // 1. Find the requesting customer
        const customer = await prisma.customer.findFirst({
            where: { userId },
            include: { user: true }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Vui lòng hoàn thiện hồ sơ thành viên trước khi yêu cầu báo giá', 'PROFILE_MISSING'), { status: 400 })
        }

        if (customer.id === contractorId) {
            return NextResponse.json(createErrorResponse('Bạn không thể gửi yêu cầu báo giá cho chính mình', 'INVALID_OPERATION'), { status: 400 })
        }

        // 2. Validate the contractor
        const contractor = await prisma.customer.findUnique({
            where: { id: contractorId },
            include: { user: true }
        })

        if (!contractor) {
            return NextResponse.json(createErrorResponse('Không tìm thấy thông tin nhà thầu', 'NOT_FOUND'), { status: 404 })
        }

        if (!contractor.contractorVerified) {
            return NextResponse.json(createErrorResponse('Thành viên này chưa được xác minh là nhà thầu', 'INVALID_OPERATION'), { status: 400 })
        }

        // 3. Project validation
        let project: any = null
        if (projectId) {
            project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    customerId: customer.id
                }
            })

            if (!project) {
                return NextResponse.json(createErrorResponse('Dự án không tồn tại hoặc không thuộc quyền sở hữu của bạn', 'NOT_FOUND'), { status: 400 })
            }
        }

        // 4. Flow 5: Create/Find Conversation for Chat Integration
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { participant1Id: customer.userId, participant2Id: contractor.userId },
                    { participant1Id: contractor.userId, participant2Id: customer.userId }
                ]
            }
        })

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participant1Id: customer.userId,
                    participant1Name: customer.user.name || 'Khách hàng',
                    participant2Id: contractor.userId,
                    participant2Name: contractor.user.name || 'Nhà thầu',
                    projectId: projectId || null,
                    projectTitle: project?.name || null
                }
            })
        }

        // Initial system message in chat
        const initialMsg = `[SYSTEM] Khách hàng ${customer.user.name} đã gửi yêu cầu báo giá mới cho dự án ${project?.name || location || ''}. Chi tiết: ${details.substring(0, 100)}...`

        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: 'SYSTEM',
                senderName: 'Hệ thống',
                content: initialMsg
            }
        })

        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessage: initialMsg,
                lastMessageAt: new Date()
            }
        })

        // 5. Create the quote request
        const quote = await prisma.quoteRequest.create({
            data: {
                customerId: customer.id,
                contractorId,
                details,
                budget,
                location,
                startDate: startDate ? new Date(startDate) : undefined,
                projectId,
                attachments: attachments || [],
                conversationId: conversation.id,
                status: 'PENDING',
                history: {
                    create: {
                        userId: customer.userId,
                        newStatus: 'PENDING',
                        notes: 'Khởi tạo yêu cầu báo giá'
                    }
                }
            }
        })

        // 6. Send notification
        try {
            await saveNotificationForUser({
                type: 'INFO' as any,
                priority: 'HIGH',
                title: 'Yêu cầu báo giá mới',
                message: `Khách hàng ${customer.user.name} vừa gửi cho bạn một yêu cầu báo giá mới cho dự án tại ${location || 'vị trí chưa xác định'}.`,
                data: {
                    quoteId: quote.id,
                    senderName: customer.user.name,
                    projectId: projectId,
                    conversationId: conversation.id
                }
            }, contractor.userId)
        } catch (notifyError) {
            console.error('Failed to send notification:', notifyError)
        }

        return NextResponse.json(createSuccessResponse(quote, 'Gửi yêu cầu báo giá thành công'), { status: 201 })

    } catch (error: any) {
        console.error('Create quote error:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
    }
}
