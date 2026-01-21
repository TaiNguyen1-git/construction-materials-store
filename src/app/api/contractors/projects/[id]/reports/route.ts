import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const projectId = (await params).id

        const reports = await (prisma as any).workerReport.findMany({
            where: {
                projectId,
                status: 'PENDING' // Usually we only show pending ones in the waitlist
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(reports))
    } catch (error) {
        console.error('Error fetching project reports:', error)
        return NextResponse.json(createErrorResponse('Internal error', 'SERVER_ERROR'), { status: 500 })
    }
}
