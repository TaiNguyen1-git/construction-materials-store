
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { getUser } from '@/lib/auth'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { status, priority } = body

        // Auth check
        const user = await getUser()

        if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const updated = await prisma.supportRequest.update({
            where: { id },
            data: {
                status: status || undefined,
                priority: priority || undefined
            }
        })

        return NextResponse.json(createSuccessResponse(updated, 'Cập nhật thành công'))
    } catch (error) {
        console.error('Update support request error:', error)
        return NextResponse.json(createErrorResponse('Failed to update support request', 'SERVER_ERROR'), { status: 500 })
    }
}
