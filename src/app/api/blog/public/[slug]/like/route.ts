import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const resolvedParams = await params
        const body = await request.json().catch(() => ({}))
        const action = body.action || 'like'
        
        const post = await prisma.blogPost.update({
            where: { slug: resolvedParams.slug },
            data: { 
                likesCount: { 
                    increment: action === 'unlike' ? -1 : 1 
                } 
            }
        })

        // Prevent negative likes
        if (post.likesCount < 0) {
            const updatedPost = await prisma.blogPost.update({
                where: { slug: resolvedParams.slug },
                data: { likesCount: 0 }
            })
            return NextResponse.json({ success: true, data: { likesCount: 0 } })
        }

        return NextResponse.json({ success: true, data: { likesCount: post.likesCount } })
    } catch (error) {
        console.error('Like error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}
