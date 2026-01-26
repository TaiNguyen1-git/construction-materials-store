/**
 * API: User Restrictions Management
 * POST /api/admin/integrity/restrictions - Apply restriction
 * PATCH /api/admin/integrity/restrictions - Lift restriction or review appeal
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { RestrictionService } from '@/lib/restriction-service'
import { AuditService } from '@/lib/audit-service'

// Apply a restriction
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const { customerId, type, reason, evidence, durationDays } = body

        if (!customerId || !type || !reason) {
            return NextResponse.json(
                createErrorResponse('Missing required fields', 'BAD_REQUEST'),
                { status: 400 }
            )
        }

        // Get admin name
        const admin = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        })

        await RestrictionService.applyRestriction(
            customerId,
            type,
            {
                reason,
                evidence,
                imposedBy: userId,
                imposedByName: admin?.name,
                durationDays
            },
            { actorIp: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined }
        )

        return NextResponse.json(
            createSuccessResponse({ success: true }, 'Đã áp dụng hạn chế cho tài khoản'),
            { status: 201 }
        )

    } catch (error: any) {
        console.error('Apply restriction error:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// Lift restriction or review appeal
export async function PATCH(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const { restrictionId, action, reason } = body

        if (!restrictionId || !action) {
            return NextResponse.json(
                createErrorResponse('Missing restrictionId or action', 'BAD_REQUEST'),
                { status: 400 }
            )
        }

        if (action === 'LIFT') {
            if (!reason) {
                return NextResponse.json(
                    createErrorResponse('Vui lòng cung cấp lý do', 'BAD_REQUEST'),
                    { status: 400 }
                )
            }

            await RestrictionService.liftRestriction(restrictionId, userId, reason)

            return NextResponse.json(
                createSuccessResponse({ success: true }, 'Đã gỡ bỏ hạn chế')
            )
        }

        if (action === 'APPROVE_APPEAL' || action === 'REJECT_APPEAL') {
            await RestrictionService.reviewAppeal(
                restrictionId,
                userId,
                action === 'APPROVE_APPEAL'
            )

            return NextResponse.json(
                createSuccessResponse(
                    { success: true },
                    action === 'APPROVE_APPEAL' ? 'Đã chấp nhận kháng cáo' : 'Đã từ chối kháng cáo'
                )
            )
        }

        return NextResponse.json(
            createErrorResponse('Invalid action', 'BAD_REQUEST'),
            { status: 400 }
        )

    } catch (error: any) {
        console.error('Restriction update error:', error)
        return NextResponse.json(
            createErrorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// Get restrictions for a customer (GET)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const customerId = searchParams.get('customerId')
        const view = searchParams.get('view')

        if (view === 'appeals') {
            const appeals = await RestrictionService.getPendingAppeals()
            return NextResponse.json(createSuccessResponse({ appeals }))
        }

        if (customerId) {
            const restrictions = await RestrictionService.getActiveRestrictions(customerId)
            return NextResponse.json(createSuccessResponse({ restrictions }))
        }

        // Get all active restrictions with customer info
        const restrictions = await prisma.userRestriction.findMany({
            where: {
                isActive: true,
                OR: [
                    { endDate: null },
                    { endDate: { gt: new Date() } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        })

        return NextResponse.json(createSuccessResponse({ restrictions }))

    } catch (error: any) {
        console.error('Get restrictions error:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
