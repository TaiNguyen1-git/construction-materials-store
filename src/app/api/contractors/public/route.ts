import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService } from '@/lib/cache'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const querySchema = z.object({
    city: z.string().optional(),
    skill: z.string().optional(),
    limit: z.string().optional().default('12').transform(val => parseInt(val)),
})

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = Object.fromEntries(searchParams.entries())

        const validation = querySchema.safeParse(params)
        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { city, skill, limit } = validation.data
        const cacheKey = `contractors:public:${city || 'all'}:${skill || 'all'}:${limit}`

        // Try cache
        const cached = await CacheService.get(cacheKey)
        if (cached) {
            return NextResponse.json(createSuccessResponse(cached), {
                headers: { 'X-Cache': 'HIT' }
            })
        }

        const contractors = await prisma.contractorProfile.findMany({
            where: {
                isVerified: true,
                ...(city && { city }),
                ...(skill && { skills: { has: skill } })
            },
            take: limit,
            orderBy: {
                avgRating: 'desc'
            },
            include: {
                customer: {
                    select: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        // Cache for 30 mins
        await CacheService.set(cacheKey, contractors, 1800)

        return NextResponse.json(createSuccessResponse(contractors))

    } catch (error) {
        console.error('Error fetching public contractors:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi khi tải danh sách đối tác', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
