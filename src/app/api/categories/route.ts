
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
    const cacheKey = 'categories:all:v4'
    const cachedResult = await CacheService.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(
        createSuccessResponse(cachedResult, 'Categories retrieved successfully from cache'),
        { status: 200 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const categories = await prisma.category.findMany({
      where: {
        isActive: includeInactive ? undefined : true,
        // If parentId is provided, filter by it. Otherwise, show all categories (undefined means no filter)
        parentId: searchParams.get('parentId') || undefined
      },
      include: {
        parent: {
          select: { id: true, name: true }
        },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isActive: true,
            products: {
              where: { isActive: true },
              select: { id: true }
            }
          }
        },
        products: {
          where: { isActive: true },
          select: { id: true }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    // Calculate total products manually due to Prisma _count issue
    const categoriesWithCounts = categories.map(category => {
      // Manual count from fetched array
      const directCount = category.products.length

      const childrenCount = category.children.reduce((sum, child) => {
        // Safe access to child.products
        const count = (child as any).products?.length || 0
        return sum + count
      }, 0)

      // Clean up the response to avoid sending large arrays of IDs
      const { products, children, ...rest } = category

      const cleanChildren = children.map(child => {
        const { products: childProducts, ...childRest } = child as any
        return {
          ...childRest,
          productCount: childProducts?.length || 0,
          _count: { products: childProducts?.length || 0 }
        }
      })

      return {
        ...rest,
        children: cleanChildren,
        totalProducts: directCount + childrenCount,
        productCount: directCount,
        _count: {
          products: directCount
        }
      }
    })

    // Cache the result for 10 minutes
    await CacheService.set(cacheKey, categoriesWithCounts, 600)

    return NextResponse.json(
      createSuccessResponse(categoriesWithCounts, 'Categories retrieved successfully'),
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
    await CacheService.del('categories:all:v2')
    await CacheService.del('categories:all:v3')
    await CacheService.del('categories:all:v4')

    return NextResponse.json(
      createSuccessResponse(category, 'Category created successfully'),
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Create category error:', error)

    // Handle unique constraint error (duplicate name)
    if (error.code === 'P2002') {
      return NextResponse.json(
        createErrorResponse('Danh mục này đã tồn tại', 'DUPLICATE_ERROR'),
        { status: 409 }
      )
    }

    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}