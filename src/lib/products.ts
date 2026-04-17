import { prisma } from './prisma'

export interface ProductFilters {
    categoryId?: string
    minPrice?: number
    maxPrice?: number
    q?: string
    sort?: string
    page?: number
    limit?: number
    isActive?: boolean
}

export async function getProducts(filters: ProductFilters = {}) {
    const {
        categoryId,
        minPrice,
        maxPrice,
        q,
        sort = 'newest',
        page = 1,
        limit = 12,
        isActive = true
    } = filters

    const skip = (page - 1) * limit

    const where: any = {
        isActive,
        categoryId: categoryId || undefined,
        price: {
            gte: minPrice,
            lte: maxPrice
        },
        OR: q ? [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } }
        ] : undefined
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price-asc') orderBy = { price: 'asc' }
    else if (sort === 'price-desc') orderBy = { price: 'desc' }
    else if (sort === 'name-asc') orderBy = { name: 'asc' }
    else if (sort === 'name-desc') orderBy = { name: 'desc' }

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                category: true,
                inventoryItem: {
                    select: { availableQuantity: true }
                }
            },
            orderBy,
            skip,
            take: limit
        }),
        prisma.product.count({ where })
    ])

    return {
        products,
        pagination: {
            total,
            page,
            limit,
            lastPage: Math.ceil(total / limit)
        }
    }
}

export async function getProductById(id: string) {
    return prisma.product.findUnique({
        where: { id },
        include: {
            category: true,
            inventoryItem: true,
            supplier: true
        }
    })
}

import { unstable_cache } from 'next/cache'

export async function getCategories() {
    return unstable_cache(
        async () => {
            return prisma.category.findMany({
                orderBy: { name: 'asc' }
            })
        },
        ['product-categories'],
        { revalidate: 3600, tags: ['product-categories'] }
    )()
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 4) {
    return prisma.product.findMany({
        where: {
            categoryId,
            id: { not: excludeId },
            isActive: true
        },
        include: {
            category: true,
            inventoryItem: { select: { availableQuantity: true } }
        },
        take: limit
    })
}
