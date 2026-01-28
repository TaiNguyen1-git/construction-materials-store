import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })

        const body = await request.json()
        const { name, amount, dueDate } = body

        if (!name || !amount) {
            return NextResponse.json(createErrorResponse('Name and amount are required', 'VALIDATION_ERROR'), { status: 400 })
        }

        const customer = await prisma.customer.findFirst({ where: { userId: payload.userId } })
        if (!customer) return NextResponse.json(createErrorResponse('Contractor not found', 'NOT_FOUND'), { status: 404 })

        // Find or create a QuoteRequest to attach the milestone to
        // If it's a ConstructionProject (Enterprise), we might need to attach milestones 
        // We'll look for an existing ACCEPTED quote or create a system mapping
        let quote = await prisma.quoteRequest.findFirst({
            where: { projectId, status: 'ACCEPTED' }
        })

        if (!quote) {
            // Create a virtual quote to house these milestones for tracking
            // Use (prisma as any) for dynamic models if needed, but quoteRequest is standard
            quote = await prisma.quoteRequest.create({
                data: {
                    projectId,
                    contractorId: customer.id,
                    customerId: 'system', // or project.customerId
                    status: 'ACCEPTED',
                    details: 'Tự động tạo để quản lý tiến độ',
                    budget: 0
                }
            })
        }

        const milestoneCount = await prisma.paymentMilestone.count({ where: { quoteId: quote.id } })

        const milestone = await prisma.paymentMilestone.create({
            data: {
                quoteId: quote.id,
                name,
                amount: parseFloat(amount),
                percentage: 0, // Calculated or set by user
                order: milestoneCount + 1,
                status: 'PENDING',
                // TODO: Verify if dueDate exists in PaymentMilestone schema
                // dueDate: dueDate ? new Date(dueDate) : null
            }
        })

        return NextResponse.json(createSuccessResponse(milestone, 'Đã thêm giai đoạn mới thành công'))
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Create Milestone Error:', error)
        return NextResponse.json(createErrorResponse(errorMessage, 'SERVER_ERROR'), { status: 500 })
    }
}
