/**
 * API: Delivery Phases
 * POST - Create phases for an order
 * GET - Get phases for an order
 */

import { NextRequest, NextResponse } from 'next/server'
import { DeliveryPhaseService } from '@/lib/delivery-phase-service'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const createPhasesSchema = z.object({
    orderId: z.string(),
    phases: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        scheduledDate: z.string().transform(s => new Date(s)),
        depositPercent: z.number().min(0).max(100).optional(),
        productIds: z.array(z.string())
    }))
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validation = createPhasesSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { orderId, phases } = validation.data

        const result = await DeliveryPhaseService.createPhasesFromOrder(orderId, phases)

        if (!result.success) {
            return NextResponse.json(
                createErrorResponse(result.error || 'Lỗi tạo đợt giao', 'INTERNAL_ERROR'),
                { status: 500 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({
                phaseIds: result.phaseIds,
                count: result.phaseIds?.length
            }, `Đã tạo ${result.phaseIds?.length} đợt giao hàng`),
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Delivery phases API error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const orderId = searchParams.get('orderId')
        const action = searchParams.get('action')

        if (action === 'suggest' && orderId) {
            const suggestions = await DeliveryPhaseService.suggestPhases(orderId)
            return NextResponse.json(createSuccessResponse({ suggestions }))
        }

        if (action === 'upcoming') {
            const days = parseInt(searchParams.get('days') || '7')
            const upcoming = await DeliveryPhaseService.getUpcomingDeliveries(days)
            return NextResponse.json(createSuccessResponse({ phases: upcoming }))
        }

        if (orderId) {
            const phases = await DeliveryPhaseService.getOrderPhases(orderId)
            return NextResponse.json(createSuccessResponse({ phases }))
        }

        return NextResponse.json(
            createErrorResponse('Missing orderId', 'BAD_REQUEST'),
            { status: 400 }
        )
    } catch (error: any) {
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
