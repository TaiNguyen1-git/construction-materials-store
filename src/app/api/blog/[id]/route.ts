import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        author: {
          select: { name: true, email: true }
        }
      }
    })

    if (!post) {
      return NextResponse.json(createErrorResponse('Post not found', 'NOT_FOUND'), { status: 404 })
    }

    return NextResponse.json(createSuccessResponse(post))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenPayload = verifyTokenFromRequest(request)
    if (!tokenPayload || !['MANAGER', 'EMPLOYEE'].includes(tokenPayload.role)) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const body = await request.json()
    const validation = blogPostSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.format()), { status: 400 })
    }

    const existingPost = await prisma.blogPost.findUnique({
      where: { id: params.id }
    })

    if (!existingPost) {
      return NextResponse.json(createErrorResponse('Post not found', 'NOT_FOUND'), { status: 404 })
    }

    // Update slug if title changed
    let slug = existingPost.slug
    if (validation.data.title !== existingPost.title) {
      slug = createSlug(validation.data.title)
      const existingSlug = await prisma.blogPost.findFirst({
        where: { slug, NOT: { id: params.id } }
      })
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`
      }
    }

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        ...validation.data,
        slug,
        publishedAt: validation.data.isPublished && !existingPost.isPublished ? new Date() : existingPost.publishedAt
      }
    })

    return NextResponse.json(createSuccessResponse(post, 'Bài viết đã được cập nhật thành công'))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenPayload = verifyTokenFromRequest(request)
    if (!tokenPayload || !['MANAGER', 'EMPLOYEE'].includes(tokenPayload.role)) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    await prisma.blogPost.delete({
      where: { id: params.id }
    })

    return NextResponse.json(createSuccessResponse(null, 'Bài viết đã được xóa thành công'))
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}
