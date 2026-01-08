
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { getUser } from '@/lib/auth'

// GET /api/admin/support - Get all support requests
export async function GET() {
    try {
        const user = await getUser()

        if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const supportRequests = await prisma.supportRequest.findMany({
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(supportRequests, 'Support requests loaded'))
    } catch (error) {
        console.error('Get support requests error:', error)
        return NextResponse.json(createErrorResponse('Failed to load support requests', 'SERVER_ERROR'), { status: 500 })
    }
}
