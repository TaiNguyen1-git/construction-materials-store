import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params
    const post = await prisma.blogPost.findUnique({
      where: { slug: resolvedParams.slug },
      include: {
        category: true,
        author: {
          select: { name: true }
        }
      }
    })

    if (!post || !post.isPublished) {
      return NextResponse.json(createErrorResponse('Post not found', 'NOT_FOUND'), { status: 404 })
    }

    // Increment view count in background (non-blocking)
    prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } }
    }).catch(console.error)

    return NextResponse.json(createSuccessResponse(post))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}
