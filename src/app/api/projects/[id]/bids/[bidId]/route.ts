import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string, bidId: string }> }
) {
    try {
        const user = verifyTokenFromRequest(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { id: projectId, bidId } = await params
        const body = await request.json()
        const { status } = body // ACCEPTED, REJECTED

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        })

        if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })

        // Check ownership
        const customer = await prisma.customer.findFirst({ where: { userId: user.userId } })
        if (!customer || customer.id !== project.customerId) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        // Update bid status
        const bid = await prisma.projectBid.update({
            where: { id: bidId },
            data: { status }
        })

        // If accepted, set the contractor for the project
        if (status === 'ACCEPTED') {
            await prisma.project.update({
                where: { id: projectId },
                data: { contractorId: bid.contractorId, status: 'IN_PROGRESS' }
            })
            
            // Reject other bids for this project?
            await prisma.projectBid.updateMany({
                where: { projectId, id: { not: bidId }, status: 'PENDING' },
                data: { status: 'REJECTED' }
            })
        }

        return NextResponse.json({ success: true, data: bid })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
