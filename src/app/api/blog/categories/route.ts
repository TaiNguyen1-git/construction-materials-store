import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import { createSlug } from '@/lib/slug-utils'

export async function GET() {
  try {
    const categories = await prisma.blogCategory.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      }
    })
    return NextResponse.json(createSuccessResponse(categories))
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

    const { name, description } = await request.json()
    if (!name) return NextResponse.json(createErrorResponse('Name is required', 'VALIDATION_ERROR'), { status: 400 })

    const slug = createSlug(name)
    const category = await prisma.blogCategory.create({
      data: { name, slug, description }
    })

    return NextResponse.json(createSuccessResponse(category, 'Category created'), { status: 201 })
  } catch (error: any) {
    return NextResponse.json(createErrorResponse(error.message, 'INTERNAL_ERROR'), { status: 500 })
  }
}
