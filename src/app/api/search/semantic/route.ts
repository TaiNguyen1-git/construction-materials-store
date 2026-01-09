import { NextRequest, NextResponse } from 'next/server'
import { semanticSearch, indexProductsForSearch, type SearchFilters } from '@/lib/ml-services'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * GET /api/search/semantic?q=xi+măng+chống+thấm&limit=20
 * Semantic search for products
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || searchParams.get('query') || ''
        const limit = parseInt(searchParams.get('limit') || '20')
        const category = searchParams.get('category')
        const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
        const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined

        if (!query.trim()) {
            return NextResponse.json(
                createErrorResponse('Search query required', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const filters: SearchFilters = {}
        if (category) filters.category = category
        if (minPrice) filters.minPrice = minPrice
        if (maxPrice) filters.maxPrice = maxPrice

        const results = await semanticSearch(query, limit, filters)

        if (results.length === 0) {
            // Fallback to database keyword search
            const fallbackResults = await keywordSearch(query, limit, filters)
            return NextResponse.json(createSuccessResponse({
                query,
                results: fallbackResults,
                totalResults: fallbackResults.length,
                searchType: 'keyword',
                source: 'fallback'
            }))
        }

        return NextResponse.json(createSuccessResponse({
            query,
            results,
            totalResults: results.length,
            searchType: 'semantic',
            source: 'ml-service'
        }))

    } catch (error) {
        console.error('Semantic search error:', error)
        return NextResponse.json(
            createErrorResponse('Search failed', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

/**
 * POST /api/search/semantic
 * Index products or perform search with body
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, query, products, limit = 20, filters } = body

        // Index products action
        if (action === 'index') {
            if (products && Array.isArray(products)) {
                const result = await indexProductsForSearch(products)
                return NextResponse.json(createSuccessResponse(result))
            }

            // Index all products from database
            const dbProducts = await prisma.product.findMany({
                where: { isActive: true },
                include: { category: true },
                take: 500 // Limit to avoid memory issues
            })

            const productData = dbProducts.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description || '',
                category: p.category?.name || '',
                brand: '', // No brand field in schema
                price: p.price
            }))

            const result = await indexProductsForSearch(productData)
            return NextResponse.json(createSuccessResponse({
                ...result,
                indexed: productData.length
            }))
        }

        // Search action (default)
        if (!query) {
            return NextResponse.json(
                createErrorResponse('Missing query', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const results = await semanticSearch(query, limit, filters)

        return NextResponse.json(createSuccessResponse({
            query,
            results,
            totalResults: results.length,
            searchType: 'semantic'
        }))

    } catch (error) {
        console.error('Semantic search POST error:', error)
        return NextResponse.json(
            createErrorResponse('Search failed', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

/**
 * Fallback keyword search using database
 */
async function keywordSearch(query: string, limit: number, filters: SearchFilters) {
    const whereClause: any = {
        isActive: true,
        OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
        ]
    }

    if (filters.category) {
        whereClause.category = { slug: filters.category }
    }
    if (filters.minPrice) {
        whereClause.price = { ...whereClause.price, gte: filters.minPrice }
    }
    if (filters.maxPrice) {
        whereClause.price = { ...whereClause.price, lte: filters.maxPrice }
    }

    const products = await prisma.product.findMany({
        where: whereClause,
        include: { category: true },
        take: limit,
        orderBy: { price: 'asc' }
    })

    return products.map(p => ({
        productId: p.id,
        name: p.name,
        category: p.category?.name || '',
        price: p.price,
        score: 0.5,
        scoreBreakdown: { semantic: 0, keyword: 1, boost: 0 },
        matchedTerms: [query],
        highlight: p.name
    }))
}
