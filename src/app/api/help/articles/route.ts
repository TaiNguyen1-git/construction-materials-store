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
