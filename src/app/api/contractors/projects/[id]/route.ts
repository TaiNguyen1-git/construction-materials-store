import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const payload = verifyTokenFromRequest(req)
        if (!payload?.userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const project = await prisma.constructionProject.findUnique({
            where: { id },
            include: {
                applications: {
                    where: { status: 'SELECTED' }
                }
            }
        })

        if (!project) {
            return NextResponse.json({ message: 'Project not found' }, { status: 404 })
        }

        // Try to find the associated QuoteRequest for milestones
        const quote = await prisma.quoteRequest.findFirst({
            where: {
                projectId: id,
                status: 'ACCEPTED'
            },
            include: {
                milestones: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        // Fetch expenses
        let expenses = []
        try {
            expenses = await (prisma as any).projectExpense.findMany({
                where: { projectId: id },
                orderBy: { createdAt: 'desc' }
            })
        } catch (e) {
            console.warn('ProjectExpense query failed (likely Prisma out of sync):', e)
        }

        return NextResponse.json({
            success: true,
            data: {
                ...project,
                milestones: quote?.milestones || [],
                expenses: expenses || [],
                progress: quote?.milestones?.length ? (quote.milestones.filter(m => m.status === 'COMPLETED').length / quote.milestones.length) * 100 : 0
            }
        })

    } catch (error: any) {
        console.error('Project Detail API Error:', error)
        return NextResponse.json({ message: error.message, stack: error.stack }, { status: 500 })
    }
}
