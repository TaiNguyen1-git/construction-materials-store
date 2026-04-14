import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const resolvedParams = await params
        const post = await prisma.blogPost.update({
            where: { slug: resolvedParams.slug },
            data: { likesCount: { increment: 1 } }
        })
        return NextResponse.json({ success: true, data: { likesCount: post.likesCount } })
    } catch (error) {
        console.error('Like error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}
