import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/help-center - Get all articles
export async function GET(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user || user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const articles = await (prisma as any).helpArticle.findMany({
            orderBy: { sortOrder: 'asc' }
        })

        return NextResponse.json(articles)
    } catch (error) {
        console.error('Get help articles error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/admin/help-center - Create or update article
export async function POST(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user || user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { id, title, slug, content, category, targetAudience, isPublished, sortOrder } = body

        if (!title || !slug || !content || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (id) {
            // Update
            const article = await (prisma as any).helpArticle.update({
                where: { id },
                data: {
                    title, slug, content, category,
                    targetAudience: targetAudience || ['CUSTOMER'],
                    isPublished: isPublished ?? true,
                    sortOrder: sortOrder || 0
                }
            })
            return NextResponse.json(article)
        } else {
            // Create
            const article = await (prisma as any).helpArticle.create({
                data: {
                    title, slug, content, category,
                    targetAudience: targetAudience || ['CUSTOMER'],
                    isPublished: isPublished ?? true,
                    sortOrder: sortOrder || 0
                }
            })
            return NextResponse.json(article, { status: 201 })
        }
    } catch (error) {
        console.error('Save help article error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/admin/help-center?id=xxx - Delete article
export async function DELETE(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user || user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await (prisma as any).helpArticle.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete help article error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
