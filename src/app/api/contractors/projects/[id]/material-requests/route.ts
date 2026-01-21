import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const projectId = (await params).id

        const requests = await (prisma as any).siteMaterialRequest.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(requests))
    } catch (error) {
        return NextResponse.json(createErrorResponse('Internal error', 'SERVER_ERROR'), { status: 500 })
    }
}
