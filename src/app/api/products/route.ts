import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '@/lib/api-types'
import { z } from 'zod'
import { CacheService } from '@/lib/cache'
import { logger, logAPI } from '@/lib/logger'

const querySchema = z.object({
  page: z.string().optional().default('1').transform(val => parseInt(val)),
  limit: z.string().optional().default('20').transform(val => parseInt(val)),
  q: z.string().optional(), // search query
  search: z.string().optional(), // alternative search param
  category: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  sort: z.string().optional(), // simplified sort param (price-asc, price-desc, name-asc, etc.)
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  featured: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  tags: z.string().optional(),
})

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().positive('Price must be positive'),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  unit: z.string().default('pcs'),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  minStockLevel: z.number().min(0).default(0),
  maxStockLevel: z.number().positive().optional(),
  reorderPoint: z.number().min(0).default(0),
})

// GET /api/products - List products with pagination and filters
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())

    const validation = querySchema.safeParse(params)
    if (!validation.success) {
      logAPI.error('GET', '/api/products', new Error('Validation failed'), { errors: validation.error.issues })
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const { page, limit, q, search, category, minPrice, maxPrice, sort, sortBy, sortOrder, isActive, featured } = validation.data
    const skip = (page - 1) * limit

    // Use q or search for search query
    const searchQuery = q || search

    // Create cache key based on query parameters
    const cacheKey = `products:${page}:${limit}:${searchQuery || 'all'}:${category || 'all'}:${minPrice || 'min'}:${maxPrice || 'max'}:${sort || sortBy}:${sortOrder}:${isActive !== undefined ? isActive : 'all'}:${featured !== undefined ? featured : 'all'}`

    // Try to get from cache first
    const cachedResult = await CacheService.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(
        createSuccessResponse(cachedResult, 'Products retrieved successfully from cache'),
        { status: 200, headers: { 'X-Cache': 'HIT' } }
      )
    }

    // Build where clause
    const where: Prisma.ProductWhereInput = {}

    // Handle search query - Use Prisma's contains directly for MongoDB
    // MongoDB with Prisma supports contains which is case-sensitive by default
    // We'll search with multiple variations to catch different cases
    if (searchQuery) {
      const normalizedQuery = searchQuery.trim()

      logger.info('Searching products', { searchQuery: normalizedQuery })

      // Build comprehensive OR condition
      // Prisma's MongoDB connector supports case-insensitive filtering with 'mode: insensitive'
      where.OR = [
        { name: { contains: normalizedQuery, mode: 'insensitive' } },
        { description: { contains: normalizedQuery, mode: 'insensitive' } },
        { sku: { contains: normalizedQuery, mode: 'insensitive' } },
        { tags: { hasSome: [normalizedQuery] } }
      ]

      // Also ensure we only get active products
      where.isActive = { not: false }
    }
    else {
      // No search query - only show active products by default
      where.isActive = { not: false }
    }

    if (category) {
      where.categoryId = category
    }

    if (validation.data.tags) {
      const tagList = validation.data.tags.split(',').map(t => t.trim())
      if (tagList.length > 0) {
        // Smart Tag Search: If a tag "Đá 1x2" is provided, 
        // search for it in tags array OR as part of the name/description
        const tagFilters = tagList.map(tag => {
          // Normalize tag for case-insensitive simulation on MongoDB
          const variations = [
            tag,
            tag.toLowerCase(),
            tag.toUpperCase(),
            tag.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
          ].filter((v, i, a) => a.indexOf(v) === i)

          return {
            OR: [
              { tags: { hasSome: variations } },
              ...variations.map(v => ({ name: { contains: v } })),
              ...variations.map(v => ({ description: { contains: v } }))
            ]
          }
        })

        // Combine with existing AND conditions (if any)
        const currentAnd = where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []
        where.AND = [...currentAnd, ...tagFilters]
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }

    // Only add isActive filter if explicitly provided
    if (isActive === true || isActive === false) {
      where.isActive = isActive
    }

    // Only add featured filter if explicitly provided
    if (featured === true || featured === false) {
      where.isFeatured = featured
    }

    // Handle simplified sort parameter
    let orderBy: Prisma.ProductOrderByWithRelationInput = { [sortBy]: sortOrder }
    if (sort) {
      switch (sort) {
        case 'price-asc':
          orderBy = { price: 'asc' }
          break
        case 'price-desc':
          orderBy = { price: 'desc' }
          break
        case 'name-asc':
          orderBy = { name: 'asc' }
          break
        case 'name-desc':
          orderBy = { name: 'desc' }
          break
        case 'newest':
          orderBy = { createdAt: 'desc' }
          break
        default:
          orderBy = { [sortBy]: sortOrder }
      }
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true }
          },
          inventoryItem: {
            select: { quantity: true, availableQuantity: true, minStockLevel: true }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where })
    ])

    const response = createPaginatedResponse(products, total, page, limit)

    // Cache the result for 15 minutes (extended for better performance)
    await CacheService.set(cacheKey, response, 900)

    const duration = Date.now() - startTime
    logAPI.response('GET', '/api/products', 200, duration, { total, page, limit })

    return NextResponse.json(
      createSuccessResponse(response, 'Products retrieved successfully'),
      { status: 200 }
    )

  } catch (error: unknown) {
    const duration = Date.now() - startTime
    const err = error as Error & { code?: string }
    logAPI.error('GET', '/api/products', err, { duration })
    logger.error('Get products error', {
      error: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    })

    // Log database connection errors specifically
    if (err.code === 'P1001' || err.message?.includes('connection')) {
      console.error('❌ Database connection error:', err.message)
    }

    return NextResponse.json(
      createErrorResponse(
        err.message || 'Internal server error',
        'INTERNAL_ERROR',
        process.env.NODE_ENV === 'development' ? {
          message: err.message,
          code: err.code,
          stack: err.stack
        } : undefined
      ),
      { status: 500 }
    )
  }
}

import { verifyTokenFromRequest, requireEmployee } from '@/lib/auth-middleware-api'

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 🛡️ Security Hardening: Verify role from authenticated token, not just headers
    const auth = verifyTokenFromRequest(request)

    if (!auth || !['MANAGER', 'EMPLOYEE'].includes(auth.role)) {
      logger.warn('Unauthorized product creation attempt', { userId: auth?.userId, userRole: auth?.role })
      return NextResponse.json(
        createErrorResponse('Insufficient permissions', 'FORBIDDEN'),
        { status: 403 }
      )
    }

    const userId = auth.userId
    const userRole = auth.role

    const body = await request.json()

    // Validate input
    const validation = createProductSchema.safeParse(body)
    if (!validation.success) {
      logAPI.error('POST', '/api/products', new Error('Validation failed'), { errors: validation.error.issues })
      return NextResponse.json(
        createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
        { status: 400 }
      )
    }

    const productData = validation.data

    // Separate inventory-related fields from product fields
    const { minStockLevel, maxStockLevel, reorderPoint, ...productFields } = productData

    // Create product and inventory item in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create product (only with Product model fields)
      const newProduct = await tx.product.create({
        data: {
          name: productFields.name,
          description: productFields.description,
          categoryId: productFields.categoryId,
          sku: productFields.sku,
          price: productFields.price,
          costPrice: productFields.costPrice,
          unit: productFields.unit,
          weight: productFields.weight,
          dimensions: productFields.dimensions,
          images: productFields.images || [],
          tags: productFields.tags || [],
          isActive: productFields.isActive,
          isFeatured: productFields.isFeatured,
        },
        include: {
          category: {
            select: { id: true, name: true }
          }
        }
      })

      // Create inventory item (with inventory-related fields)
      await tx.inventoryItem.create({
        data: {
          productId: newProduct.id,
          quantity: 0,
          availableQuantity: 0,
          minStockLevel: minStockLevel || 0,
          maxStockLevel: maxStockLevel,
          reorderPoint: reorderPoint || 0,
        }
      })

      return newProduct
    })

    // Clean only product-related cache (Smart Invalidation)
    await CacheService.delByPrefix('products:')

    const duration = Date.now() - startTime
    logger.info('Product created', { productId: product.id, userId, duration })
    logAPI.response('POST', '/api/products', 201, duration)

    return NextResponse.json(
      createSuccessResponse(product, 'Product created successfully'),
      { status: 201 }
    )

  } catch (error: unknown) {
    const duration = Date.now() - startTime
    const err = error as Error
    logAPI.error('POST', '/api/products', err, { duration })
    logger.error('Create product error', { error: err.message, stack: err.stack })

    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}