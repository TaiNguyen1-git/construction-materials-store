import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/supplier/support?supplierId=...
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')

        if (!supplierId) {
            return NextResponse.json(createErrorResponse('Missing supplierId'), { status: 400 })
        }

        const disputes = await (prisma as any).dispute.findMany({
            where: { supplierId },
            include: {
                comments: true,
                evidence: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(disputes))
    } catch (error) {
        console.error('Fetch support tickets error:', error)
        return NextResponse.json(createErrorResponse('Server error'), { status: 500 })
    }
}

// POST /api/supplier/support - Create a new ticket
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { supplierId, reason, description, orderId, evidenceUrls } = body

        if (!supplierId || !reason || !description) {
            return NextResponse.json(createErrorResponse('Thiếu thông tin bắt buộc'), { status: 400 })
        }

        const dispute = await (prisma as any).dispute.create({
            data: {
                supplierId,
                reason,
                description,
                orderId,
                type: 'SUPPLIER_TO_STORE',
                status: 'OPEN',
                evidence: {
                    create: evidenceUrls?.map((url: string) => ({ imageUrl: url })) || []
                }
            }
        })

        return NextResponse.json(createSuccessResponse(dispute, 'Đã tạo phiếu hỗ trợ'))
    } catch (error) {
        console.error('Create support ticket error:', error)
        return NextResponse.json(createErrorResponse('Server error'), { status: 500 })
    }
}
