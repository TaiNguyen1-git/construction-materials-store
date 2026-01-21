import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const projectId = (await params).id

        const query: any = {
            status: 'PENDING'
        }

        if (projectId !== 'active') {
            query.projectId = projectId
        }

        const reports = await (prisma as any).workerReport.findMany({
            where: query,
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(reports))
    } catch (error) {
        console.error('Error fetching project reports:', error)
        return NextResponse.json(createErrorResponse('Internal error', 'SERVER_ERROR'), { status: 500 })
    }
}
