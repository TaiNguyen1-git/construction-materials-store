import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

// PUT /api/banners/[id] - Update banner
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUser()
        if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { title, description, imageUrl, tag, link, order, isActive } = body

        const banner = await prisma.banner.update({
            where: { id: params.id },
            data: {
                title,
                description,
                imageUrl,
                tag,
                link,
                order,
                isActive,
            },
        })

        return NextResponse.json(banner)
    } catch (error) {
        console.error('Error updating banner:', error)
        return NextResponse.json(
            { error: 'Failed to update banner' },
            { status: 500 }
        )
    }
}

// DELETE /api/banners/[id] - Delete banner
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUser()
        if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.banner.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting banner:', error)
        return NextResponse.json(
            { error: 'Failed to delete banner' },
            { status: 500 }
        )
    }
}
