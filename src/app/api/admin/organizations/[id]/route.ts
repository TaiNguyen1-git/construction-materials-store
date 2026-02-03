import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const payload = verifyTokenFromRequest(request)
        if (!payload || (payload.role !== 'MANAGER' && payload.role !== 'EMPLOYEE')) {
            return NextResponse.json(createErrorResponse('Unauthorized access', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const { isActive } = body

        if (typeof isActive === 'undefined') {
            return NextResponse.json(createErrorResponse('Missing isActive state', 'BAD_REQUEST'), { status: 400 })
        }

        const updated = await prisma.organization.update({
            where: { id },
            data: { isActive }
        })

        return NextResponse.json(createSuccessResponse(updated))

    } catch (error: any) {
        console.error('Admin Org Update Error:', error)
        return NextResponse.json(createErrorResponse('Failed to update organization', 'SERVER_ERROR'), { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const payload = verifyTokenFromRequest(request)
        if (!payload || (payload.role !== 'MANAGER' && payload.role !== 'EMPLOYEE')) {
            return NextResponse.json(createErrorResponse('Unauthorized access', 'UNAUTHORIZED'), { status: 401 })
        }

        // Before deleting, check if there are orders or members that might block deletion (due to relations)
        // In Prisma, we might need to delete related records or update them to be null.
        // For B2B Organizations, they usually have members and orders.

        // A safer way is to mark as deleted or just disconnect everything.
        // But the user specifically asked for "Delete".

        // Let's check for orders first. If there are orders, maybe we shouldn't hard delete?
        const org = await prisma.organization.findUnique({
            where: { id },
            include: { _count: { select: { orders: true } } }
        })

        if (!org) {
            return NextResponse.json(createErrorResponse('Organization not found', 'NOT_FOUND'), { status: 404 })
        }

        if (org._count.orders > 0) {
            return NextResponse.json(createErrorResponse('Cannot delete organization with existing orders. Use Block instead.', 'CONFLICT'), { status: 409 })
        }

        // Delete members and invitations first if we are doing a hard delete
        await prisma.organizationMember.deleteMany({ where: { organizationId: id } })
        await prisma.organizationInvitation.deleteMany({ where: { organizationId: id } })

        // Finally delete the organization
        await prisma.organization.delete({
            where: { id }
        })

        return NextResponse.json(createSuccessResponse({ message: 'Organization deleted successfully' }))

    } catch (error: any) {
        console.error('Admin Org Delete Error:', error)
        return NextResponse.json(createErrorResponse(error.message || 'Failed to delete organization', 'SERVER_ERROR'), { status: 500 })
    }
}
