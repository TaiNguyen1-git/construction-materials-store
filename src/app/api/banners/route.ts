import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

// GET /api/banners - Public endpoint to get active banners
export async function GET() {
    try {
        const banners = await prisma.banner.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                order: 'asc',
            },
        })
        return NextResponse.json(banners, {
            headers: {
                'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60',
            }
        })
    } catch (error) {
        console.error('Error fetching banners:', error)
        return NextResponse.json(
            { error: 'Failed to fetch banners' },
            { status: 500 }
        )
    }
}

// POST /api/banners - Admin only endpoint to create a banner
export async function POST(request: Request) {
    try {
        const user = await getUser()
        if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { title, description, imageUrl, tag, link, order } = body

        if (!title || !description || !imageUrl) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const banner = await prisma.banner.create({
            data: {
                title,
                description,
                imageUrl,
                tag,
                link,
                order: order || 0,
                isActive: true,
            },
        })

        return NextResponse.json(banner)
    } catch (error) {
        console.error('Error creating banner:', error)
        return NextResponse.json(
            { error: 'Failed to create banner' },
            { status: 500 }
        )
    }
}
