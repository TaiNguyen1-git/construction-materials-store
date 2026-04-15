import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getUser()
        if (!session?.userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const savedPosts = await prisma.savedPost.findMany({
            where: { userId: session.userId },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        featuredImage: true,
                        publishedAt: true,
                        author: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: savedPosts })
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
    }
}
