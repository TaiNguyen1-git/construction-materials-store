
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
        { status: 200, headers: { 'X-Cache': 'HIT' } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Fetch all categories and all active products to manually associate them
    // This bypasses potential Prisma/MongoDB relation issues
    const [categories, allProducts] = await Promise.all([
      prisma.category.findMany({
        where: {
          isActive: includeInactive ? undefined : true,
          parentId: searchParams.get('parentId') || undefined
        },
        include: {
          children: {
            where: { isActive: true },
          }
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, categoryId: true, images: true }
      })
    ])

    // Calculate total products manually
    const categoriesWithCounts = (categories as any[]).map(category => {
      // Find products directly in this category
      const directProducts = allProducts.filter(p => p.categoryId === category.id)
      const directCount = directProducts.length

      // Find products in children categories
      const childrenIds = (category.children || []).map((c: any) => c.id)
      const childrenProducts = allProducts.filter(p => childrenIds.includes(p.categoryId))
      const childrenCount = childrenProducts.length

      // Total count for this category (direct + children)
      const totalCount = directCount + childrenCount

      // Use the first product image (from direct or children) as fallback
      const allCategoryProducts = [...directProducts, ...childrenProducts]
      const fallbackImage = allCategoryProducts.find(p => p.images && p.images.length > 0)?.images[0] || null

      // Ensure we have a valid image URL (some might be placeholders)
      const categoryImage = category.image || fallbackImage

      const cleanChildren = (category.children || []).map((child: any) => {
        const childDirectProducts = allProducts.filter(p => p.categoryId === child.id)
        return {
          ...child,
          productCount: childDirectProducts.length,
          _count: { products: childDirectProducts.length }
        }
      })

      return {
        ...category,
        image: categoryImage,
        children: cleanChildren,
        totalProducts: totalCount,
        productCount: totalCount,
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

import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    // 🛡️ Security Hardening: Verify role from authenticated token
    const auth = verifyTokenFromRequest(request)

    if (!auth || auth.role !== 'MANAGER') {
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

    // Clean only category-related cache (Smart Invalidation)
    await CacheService.delByPrefix('categories:')

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