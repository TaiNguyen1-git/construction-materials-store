import { prisma } from './prisma'

export interface BlogFilters {
    categoryId?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    isPublished?: boolean
}

export async function getBlogPosts(filters: BlogFilters = {}) {
    const {
        categoryId,
        page = 1,
        limit = 10,
        sortBy = 'publishedAt',
        sortOrder = 'desc',
        search = '',
        isPublished = true
    } = filters

    const skip = (page - 1) * limit

    const where: any = {
        isPublished,
        categoryId: categoryId || undefined,
        OR: search ? [
            { title: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } }
        ] : undefined
    }

    const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            include: {
                category: true,
                author: {
                    select: { name: true, id: true }
                }
            },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        }),
        prisma.blogPost.count({ where })
    ])

    return {
        posts,
        pagination: {
            total,
            page,
            limit,
            lastPage: Math.ceil(total / limit)
        }
    }
}

export async function getBlogPostBySlug(slug: string) {
    const post = await prisma.blogPost.findUnique({
        where: { slug, isPublished: true },
        include: {
            category: true,
            author: {
                select: { name: true, id: true }
            }
        }
    })

    if (post) {
        // Increment view count in background
        prisma.blogPost.update({
            where: { id: post.id },
            data: { viewCount: { increment: 1 } }
        }).catch(err => console.error('Error incrementing view count:', err))
    }

    return post
}

import { unstable_cache } from 'next/cache'

export async function getBlogCategories() {
    return unstable_cache(
        async () => {
            return prisma.blogCategory.findMany({
                include: {
                    _count: {
                        select: { posts: true }
                    }
                },
                orderBy: { name: 'asc' }
            })
        },
        ['blog-categories'],
        { revalidate: 3600, tags: ['blog-categories'] }
    )()
}

export async function getRelatedPosts(categoryId: string, excludeId: string, limit = 3) {
    return prisma.blogPost.findMany({
        where: {
            categoryId,
            id: { not: excludeId },
            isPublished: true
        },
        include: {
            category: true,
            author: { select: { name: true } }
        },
        orderBy: { publishedAt: 'desc' },
        take: limit
    })
}

export async function getTrendingPosts(limit = 5) {
    return prisma.blogPost.findMany({
        where: { isPublished: true },
        include: {
            category: true,
            author: { select: { name: true } }
        },
        orderBy: { viewCount: 'desc' },
        take: limit
    })
}
