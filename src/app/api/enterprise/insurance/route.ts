/**
 * API: Insurance Management
 * POST - Create insurance policy
 * GET - List policies
 */

import { NextRequest, NextResponse } from 'next/server'
import { InsuranceService } from '@/lib/insurance-service'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const createPolicySchema = z.object({
    projectId: z.string().optional(),
    quoteId: z.string().optional(),
    contractId: z.string().optional(),

    insurerName: z.string().min(1),
    insurerCode: z.string().optional(),

    insuranceType: z.enum([
        'CONSTRUCTION_ALL_RISK',
        'LIABILITY',
        'WORKERS_COMPENSATION',
        'EQUIPMENT',
        'MATERIAL_TRANSIT',
        'PROFESSIONAL_INDEMNITY'
    ]),
    coverageAmount: z.number().positive(),
    deductible: z.number().optional(),
    premium: z.number().positive(),

    effectiveDate: z.string().transform(s => new Date(s)),
    expiryDate: z.string().transform(s => new Date(s)),

    insuredName: z.string().min(1),
    insuredTaxCode: z.string().optional(),
    insuredAddress: z.string().optional(),

    beneficiaryName: z.string().optional(),
    policyDocUrl: z.string().optional()
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validation = createPolicySchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const result = await InsuranceService.createPolicy(validation.data)

        if (!result.success) {
            return NextResponse.json(
                createErrorResponse(result.error || 'Lỗi tạo bảo hiểm', 'INTERNAL_ERROR'),
                { status: 500 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({
                policyId: result.policyId,
                policyNumber: result.policyNumber
            }, 'Đã tạo hợp đồng bảo hiểm thành công'),
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Insurance API error:', error)
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
        const projectValue = searchParams.get('projectValue')
        const duration = searchParams.get('duration')

        // If asking for options
        if (projectValue && duration) {
            const options = InsuranceService.getInsuranceOptions(
                parseFloat(projectValue),
                parseInt(duration)
            )
            return NextResponse.json(createSuccessResponse({ options }))
        }

        // Get policies for project
        if (projectId) {
            const policies = await InsuranceService.getProjectPolicies(projectId)
            return NextResponse.json(createSuccessResponse({ policies }))
        }

        return NextResponse.json(
            createErrorResponse('Missing projectId or projectValue/duration', 'BAD_REQUEST'),
            { status: 400 }
        )
    } catch (error: any) {
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
