/**
 * Credit Configuration API
 * GET/POST/PUT endpoints for debt configuration rules
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Helper functions
function createSuccessResponse(data: any, message?: string) {
    return { success: true, data, message }
}

function createErrorResponse(message: string, code?: string, details?: any) {
    return { success: false, error: message, code, details }
}

// Validation schema
const configSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    maxOverdueDays: z.number().min(0).default(30),
    creditLimitPercent: z.number().min(0).max(200).default(100),
    autoHoldOnOverdue: z.boolean().default(true),
    warningDays: z.number().min(0).default(7),
    isActive: z.boolean().default(true)
})

// GET /api/credit/config - Get all debt configurations
export async function GET(request: NextRequest) {
    try {
        const configs = await (prisma as any).debtConfiguration.findMany({
            orderBy: { createdAt: 'asc' }
        })

        return NextResponse.json(
            createSuccessResponse(configs, 'Debt configurations retrieved'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get debt config error:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// POST /api/credit/config - Create new debt configuration
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validation = configSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Validation failed', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { name, maxOverdueDays, creditLimitPercent, autoHoldOnOverdue, warningDays, isActive } = validation.data

        const config = await (prisma as any).debtConfiguration.create({
            data: {
                name,
                maxOverdueDays,
                creditLimitPercent,
                autoHoldOnOverdue,
                warningDays,
                isActive
            }
        })

        return NextResponse.json(
            createSuccessResponse(config, 'Debt configuration created'),
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Create debt config error:', error)

        // Handle unique constraint error
        if (error.code === 'P2002') {
            return NextResponse.json(
                createErrorResponse('Configuration with this name already exists', 'DUPLICATE_ERROR'),
                { status: 400 }
            )
        }

        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// PUT /api/credit/config - Update debt configuration
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const validation = configSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Validation failed', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { id, name, maxOverdueDays, creditLimitPercent, autoHoldOnOverdue, warningDays, isActive } = validation.data

        if (!id) {
            return NextResponse.json(
                createErrorResponse('ID is required for update', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const config = await (prisma as any).debtConfiguration.update({
            where: { id },
            data: {
                name,
                maxOverdueDays,
                creditLimitPercent,
                autoHoldOnOverdue,
                warningDays,
                isActive
            }
        })

        return NextResponse.json(
            createSuccessResponse(config, 'Debt configuration updated'),
            { status: 200 }
        )
    } catch (error: any) {
        console.error('Update debt config error:', error)

        if (error.code === 'P2025') {
            return NextResponse.json(
                createErrorResponse('Configuration not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
