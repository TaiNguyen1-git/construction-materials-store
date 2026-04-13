import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest, getUserIdFromRequest } from '@/lib/auth-middleware-api'
import { z } from 'zod'
import { createSlug } from '@/lib/slug-utils'

const blogPostSchema = z.object({
  title: z.string().min(5),
  summary: z.string().optional(),
  content: z.string().min(20),
  featuredImage: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPublished = searchParams.get('isPublished') === 'true' ? true : searchParams.get('isPublished') === 'false' ? false : undefined
    const categoryId = searchParams.get('categoryId')

    const posts = await prisma.blogPost.findMany({
      where: {
        isPublished: isPublished !== undefined ? isPublished : undefined,
        categoryId: categoryId || undefined
      },
      include: {
        category: true,
        author: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(createSuccessResponse(posts))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenPayload = verifyTokenFromRequest(request)
    if (!tokenPayload || !['MANAGER', 'EMPLOYEE'].includes(tokenPayload.role)) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(createErrorResponse('User not found', 'USER_NOT_FOUND'), { status: 400 })
    }

    const body = await request.json()
    const validation = blogPostSchema.safeParse(body)

    if (!validation.success) {
       return NextResponse.json(createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.format()), { status: 400 })
    }

    const { title } = validation.data
    let slug = createSlug(title)
    
    // Check for unique slug
    const existing = await prisma.blogPost.findUnique({ where: { slug } })
    if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    const post = await prisma.blogPost.create({
      data: {
        ...validation.data,
        slug,
        authorId: userId,
        publishedAt: validation.data.isPublished ? new Date() : null
      }
    })

    return NextResponse.json(createSuccessResponse(post, 'Bài viết đã được tạo thành công'), { status: 201 })
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}
