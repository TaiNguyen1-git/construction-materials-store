/**
 * API: E-Contract Management
 * POST - Create contract
 * GET - List contracts
 */

import { NextRequest, NextResponse } from 'next/server'
import { EContractService } from '@/lib/e-contract-service'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const partySchema = z.object({
    name: z.string().min(1),
    taxCode: z.string().optional(),
    address: z.string().optional(),
    representative: z.string().min(1),
    role: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional()
})

const createContractSchema = z.object({
    title: z.string().min(1),
    contractType: z.enum(['SERVICE', 'SUPPLY', 'CONSTRUCTION', 'MAINTENANCE', 'FRAMEWORK']),
    partyA: partySchema,
    partyB: partySchema,
    totalValue: z.number().positive(),
    startDate: z.string().transform(s => new Date(s)),
    endDate: z.string().optional().transform(s => s ? new Date(s) : undefined),
    paymentTerms: z.string().optional(),
    clauses: z.array(z.object({
        id: z.string(),
        title: z.string(),
        content: z.string()
    })).optional(),
    quoteId: z.string().optional(),
    projectId: z.string().optional(),
    orderId: z.string().optional()
})

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const validation = createContractSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const result = await EContractService.createContract({
            ...validation.data,
            createdBy: userId
        })

        if (!result.success) {
            return NextResponse.json(
                createErrorResponse(result.error || 'Lỗi tạo hợp đồng', 'INTERNAL_ERROR'),
                { status: 500 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({
                contractId: result.contractId,
                contractNumber: result.contractNumber
            }, 'Đã tạo hợp đồng thành công'),
            { status: 201 }
        )
    } catch (error: any) {
        console.error('E-Contract API error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')
        const quoteId = searchParams.get('quoteId')
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') || '50')

        const contracts = await EContractService.listContracts({
            projectId: projectId || undefined,
            quoteId: quoteId || undefined,
            status: status as any,
            limit
        })

        return NextResponse.json(createSuccessResponse({ contracts }))
    } catch (error: any) {
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
