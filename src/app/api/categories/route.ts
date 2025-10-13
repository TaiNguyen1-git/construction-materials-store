import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { CacheService } from '@/lib/cache'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
})

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    // Try to get from cache first
    const cacheKey = 'categories:all'
    const cachedResult = await CacheService.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(
        createSuccessResponse(cachedResult, 'Categories retrieved successfully from cache'),
        { status: 200 }
      )
    }

    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: { id: true, name: true }
        },
        children: {
          select: { id: true, name: true, isActive: true }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    // Cache the result for 10 minutes
    await CacheService.set(cacheKey, categories, 600)

    return NextResponse.json(
      createSuccessResponse(categories, 'Categories retrieved successfully'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'MANAGER') {
      return NextResponse.json(
        createErrorResponse('Manager access required', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validation = createCategorySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const categoryData = validation.data

    // Create category
    const category = await prisma.category.create({
      data: categoryData,
      include: {
        parent: {
          select: { id: true, name: true }
        },
        children: {
          select: { id: true, name: true, isActive: true }
        },
        _count: {
          select: { products: true }
        }
      }
    })

    // Clear categories cache when a new category is added
    await CacheService.del('categories:all')

    return NextResponse.json(
      createSuccessResponse(category, 'Category created successfully'),
      { status: 201 }
    )

  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}