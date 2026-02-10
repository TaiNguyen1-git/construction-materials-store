import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/help/articles - Get published articles
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const audience = searchParams.get('audience') // CUSTOMER, CONTRACTOR, SUPPLIER
        const query = searchParams.get('q')

        const where: any = {
            isPublished: true
        }

        if (audience) {
            where.targetAudience = { has: audience }
        }

        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } }
            ]
        }

        const articles = await (prisma as any).helpArticle.findMany({
            where,
            orderBy: { sortOrder: 'asc' }
        })

        return NextResponse.json(articles)
    } catch (error) {
        console.error('Get help articles error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH /api/help/articles/[id]/helpful - Increment helpful count
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const { type } = await req.json() // 'yes' or 'no'

        if (type === 'yes') {
            await (prisma as any).helpArticle.update({
                where: { id },
                data: { helpfulYes: { increment: 1 } }
            })
        } else {
            await (prisma as any).helpArticle.update({
                where: { id },
                data: { helpfulNo: { increment: 1 } }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
