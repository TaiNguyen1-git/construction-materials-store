import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    
    // TEMPORARILY DISABLE CACHE FOR DEBUGGING
    // Try to get from cache first
    // const cachedResult = await CacheService.get(cacheKey)
    // if (cachedResult) {
    //   return NextResponse.json(
    //     createSuccessResponse(cachedResult, 'Products retrieved successfully from cache'),
    //     { status: 200 }
    //   )
    // }

    // Build where clause
    const where: any = {}
    
    // Handle search query - Use Prisma's contains directly for MongoDB
    // MongoDB with Prisma supports contains which is case-sensitive by default
    // We'll search with multiple variations to catch different cases
    if (searchQuery) {
      const normalizedQuery = searchQuery.trim()
      
      logger.info('Searching products', { searchQuery: normalizedQuery })
      
      // Create comprehensive search variations for case-insensitive matching
      // Since MongoDB with Prisma is case-sensitive, we need to try all variations
      const lowerQuery = normalizedQuery.toLowerCase()
      const upperQuery = normalizedQuery.toUpperCase()
      
      // Vietnamese text normalization: "xi măng" -> "Xi măng", "XI MĂNG", etc.
      // Split by words and capitalize first letter of each word
      const words = normalizedQuery.split(/\s+/)
      const capitalizedQuery = words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      
      // Also try with only first word capitalized
      const firstWordCapitalized = words.length > 0
        ? words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase() + 
          (words.length > 1 ? ' ' + words.slice(1).join(' ').toLowerCase() : '')
        : normalizedQuery
      
      // Collect all unique variations
      const searchVariations = [
        normalizedQuery,          // Original: "xi măng"
        lowerQuery,               // Lowercase: "xi măng"
        upperQuery,               // Uppercase: "XI MĂNG"
        capitalizedQuery,         // Capitalized: "Xi Măng"
        firstWordCapitalized,     // First word capitalized: "Xi măng"
      ].filter(Boolean)
      
      // Remove duplicates (case-insensitive)
      const uniqueVariations = Array.from(
        new Map(searchVariations.map(v => [v.toLowerCase(), v])).values()
      )
      
      logger.info('Search variations', { 
        original: normalizedQuery,
        variations: uniqueVariations,
        variationCount: uniqueVariations.length
      })
      
      // Build comprehensive OR condition with all variations
      const orConditions: any[] = []
      
      // For each variation, search in name, description, and SKU
      for (const variation of uniqueVariations) {
        orConditions.push(
          { name: { contains: variation } },
          { description: { contains: variation } },
          { sku: { contains: variation } }
        )
      }
      
      // Also search in tags array
      orConditions.push({ tags: { hasSome: uniqueVariations } })
      
      where.OR = orConditions
      
      // Also ensure we only get active products
      where.isActive = { not: false }
      
      logger.info('Built where clause for search', { 
        orCount: where.OR.length,
        isActive: where.isActive,
        sampleConditions: where.OR.slice(0, 3)
      })
    } else {
      // No search query - only show active products by default
      where.isActive = { not: false }
    }

    if (category) {
      where.categoryId = category
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
    let orderBy: any = { [sortBy]: sortOrder }
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
    
    // TEMPORARILY DISABLE CACHE FOR DEBUGGING
    // Cache the result for 5 minutes
    // await CacheService.set(cacheKey, response, 300)
    
    const duration = Date.now() - startTime
    logAPI.response('GET', '/api/products', 200, duration, { total, page, limit })
    
    return NextResponse.json(
      createSuccessResponse(response, 'Products retrieved successfully'),
      { status: 200 }
    )

  } catch (error: any) {
    const duration = Date.now() - startTime
    logAPI.error('GET', '/api/products', error, { duration })
    logger.error('Get products error', { 
      error: error.message, 
      stack: error.stack,
      name: error.name,
      code: error.code,
      cause: error.cause
    })
    
    // Log database connection errors specifically
    if (error.code === 'P1001' || error.message?.includes('connection')) {
      console.error('❌ Database connection error:', error.message)
    }
    
    return NextResponse.json(
      createErrorResponse(
        error.message || 'Internal server error', 
        'INTERNAL_ERROR',
        process.env.NODE_ENV === 'development' ? { 
          message: error.message, 
          code: error.code,
          stack: error.stack 
        } : undefined
      ),
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check user role from middleware
    const userRole = request.headers.get('x-user-role')
    const userId = request.headers.get('x-user-id')
    
    if (!['MANAGER', 'EMPLOYEE'].includes(userRole || '')) {
      logger.warn('Unauthorized product creation attempt', { userId, userRole })
      return NextResponse.json(
        createErrorResponse('Insufficient permissions', 'FORBIDDEN'),
        { status: 403 }
      )
    }

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

    // Create product and inventory item in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const newProduct = await tx.product.create({
        data: {
          ...productData,
          images: productData.images || [],
          tags: productData.tags || [],
        },
        include: {
          category: {
            select: { id: true, name: true }
          }
        }
      })

      // Create inventory item
      await tx.inventoryItem.create({
        data: {
          productId: newProduct.id,
          quantity: 0,
          availableQuantity: 0,
          minStockLevel: productData.minStockLevel,
          maxStockLevel: productData.maxStockLevel,
          reorderPoint: productData.reorderPoint,
        }
      })

      return newProduct
    })

    // Clear products cache when a new product is added
    await CacheService.flush()

    const duration = Date.now() - startTime
    logger.info('Product created', { productId: product.id, userId, duration })
    logAPI.response('POST', '/api/products', 201, duration)

    return NextResponse.json(
      createSuccessResponse(product, 'Product created successfully'),
      { status: 201 }
    )

  } catch (error: any) {
    const duration = Date.now() - startTime
    logAPI.error('POST', '/api/products', error, { duration })
    logger.error('Create product error', { error: error.message, stack: error.stack })
    
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}