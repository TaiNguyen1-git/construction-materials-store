import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/supplier/support/[id]?supplierId=...
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')

        if (!supplierId) {
            return NextResponse.json(createErrorResponse('Missing supplierId'), { status: 400 })
        }

        const dispute = await (prisma as any).dispute.findUnique({
            where: { id, supplierId },
            include: {
                comments: {
                    include: { author: true },
                    orderBy: { createdAt: 'asc' }
                },
                evidence: true
            }
        })

        if (!dispute) {
            return NextResponse.json(createErrorResponse('Yêu cầu không tồn tại'), { status: 404 })
        }

        return NextResponse.json(createSuccessResponse(dispute))
    } catch (error) {
        console.error('Fetch ticket detail error:', error)
        return NextResponse.json(createErrorResponse('Server error'), { status: 500 })
    }
}
