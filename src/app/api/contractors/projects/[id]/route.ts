import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        
        // Validate ObjectID format to prevent Prisma crash (P2023)
        if (!/^[a-f\d]{24}$/i.test(id)) {
            return NextResponse.json({ message: 'Invalid project ID format' }, { status: 404 })
        }

        const payload = verifyTokenFromRequest(req)
        if (!payload?.userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const project = await prisma.constructionProject.findUnique({
            where: { id },
            include: { applications: { where: { status: 'SELECTED' } } }
        })

        // If not a ConstructionProject, try internal Project
        const isInternal = !project
        let internalProject: any = null
        if (isInternal) {
            internalProject = await (prisma as any).project.findUnique({
                where: { id },
                include: { projectBids: true }
            }).catch(() => null)
        }

        if (!project && !internalProject) {
            return NextResponse.json({ message: 'Project not found' }, { status: 404 })
        }

        // Try to find the associated QuoteRequest for milestones
        const quote = await prisma.quoteRequest.findFirst({
            where: { projectId: id, status: 'ACCEPTED' },
            include: { milestones: { orderBy: { order: 'asc' } } }
        })

        // Fetch expenses
        let expenses: Record<string, unknown>[] = []
        try {
            expenses = await prisma.projectExpense.findMany({
                where: { projectId: id },
                orderBy: { createdAt: 'desc' }
            })
        } catch (e) {
            console.warn('ProjectExpense query failed (likely Prisma out of sync):', e)
        }

        // Find the current contractor record
        const contractor = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        // For ConstructionProject → check ProjectApplication
        // For internal Project → check ProjectBid
        let userBid = null
        if (contractor) {
            if (!isInternal) {
                const application = await prisma.projectApplication.findFirst({
                    where: { projectId: id, contractorId: contractor.id },
                    orderBy: { createdAt: 'desc' }
                })
                if (application) {
                    userBid = { id: application.id, status: application.status, amount: application.proposedBudget || 0, createdAt: application.createdAt }
                }
            } else {
                const bid = await prisma.projectBid.findFirst({
                    where: { projectId: id, contractorId: contractor.id },
                    orderBy: { createdAt: 'desc' }
                })
                if (bid) {
                    userBid = { id: bid.id, status: bid.status, amount: bid.amount, createdAt: bid.createdAt }
                }
            }
        }

        // Build response data from whichever source was found
        const sourceProject = project ?? internalProject
        const applicationCount = project
            ? (project.applications?.length ?? 0)
            : (internalProject?.projectBids?.length ?? 0)

        return NextResponse.json({
            success: true,
            data: {
                id: sourceProject.id,
                title: project ? sourceProject.title : sourceProject.name,
                description: sourceProject.description || '',
                projectType: project ? sourceProject.projectType : (sourceProject.category || 'general'),
                location: sourceProject.location || '',
                city: project ? sourceProject.city : (sourceProject.location?.split(',').pop()?.trim() || 'Toàn quốc'),
                estimatedBudget: project ? sourceProject.estimatedBudget : sourceProject.budget,
                status: sourceProject.status,
                contactName: project ? sourceProject.contactName : (sourceProject.guestName || 'Khách hàng'),
                isUrgent: project ? sourceProject.isUrgent : (sourceProject.priority === 'HIGH'),
                requirements: sourceProject.requirements || [],
                createdAt: sourceProject.createdAt,
                applicationCount,
                userBid,
                milestones: quote?.milestones || [],
                expenses: expenses || [],
                progress: quote?.milestones?.length ? (quote.milestones.filter(m => m.status === 'COMPLETED').length / quote.milestones.length) * 100 : 0
            }
        })

    } catch (error: unknown) {
        console.error('Project Detail API Error:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ message, stack: error instanceof Error ? error.stack : undefined }, { status: 500 })
    }
}
