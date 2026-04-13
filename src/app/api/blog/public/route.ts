import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const limit = parseInt(searchParams.get('limit') || '10')

    const posts = await prisma.blogPost.findMany({
      where: {
        isPublished: true,
        categoryId: categoryId || undefined
      },
      include: {
        category: true,
        author: {
           select: { name: true }
        }
      },
      orderBy: { publishedAt: 'desc' },
      take: limit
    })

    return NextResponse.json(createSuccessResponse(posts))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}
