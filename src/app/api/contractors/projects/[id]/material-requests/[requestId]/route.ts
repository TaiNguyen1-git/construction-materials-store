import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; requestId: string }> }
) {
    try {
        const { requestId } = (await params)
        const body = await request.json()
        const { status } = body

        const updated = await (prisma as any).siteMaterialRequest.update({
            where: { id: requestId },
            data: { status }
        })

        // If approved, you might want to create a draft order, but for now just update status
        return NextResponse.json(createSuccessResponse(updated))
    } catch (error) {
        return NextResponse.json(createErrorResponse('Internal error', 'SERVER_ERROR'), { status: 500 })
    }
}
