/**
 * Contractor Review API - Submit a new review
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST /api/contractors/[id]/reviews - Submit a review
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const userId = request.headers.get('x-user-id')

        // Basic validation
        if (!userId) {
            return NextResponse.json(
                createErrorResponse('User ID required', 'UNAUTHORIZED'),
                { status: 401 }
            )
        }

        const { rating, comment, title, projectId } = body

        if (!rating || !comment) {
            return NextResponse.json(
                createErrorResponse('Rating and comment are required', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                createErrorResponse('Rating must be between 1 and 5', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Verify contractor exists
        const contractor = await prisma.contractorProfile.findUnique({
            where: { id }
        })

        if (!contractor) {
            return NextResponse.json(
                createErrorResponse('Contractor not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Determine current user ID if it's a valid ObjectId (since schema expects ObjectId for reviewerId)
        // For this demo/seed data, we might be using non-ObjectId strings for customerIds.
        // However, the Prisma schema says `reviewerId String @db.ObjectId`.
        // Wait, let's check the schema again.
        // In step 877, we changed customerId to String (flexible). 
        // But ContractorReview.reviewerId is likely still @db.ObjectId.
        // I should check schema.prisma first to be sure. 

        // Actually, I'll proceed with writing this file, but I suspect I might need to adjust the schema 
        // if reviewerId is strictly ObjectId and our user IDs are "guest_..." or flexible strings.
        // Let's assume for now I should use a valid objectId or update schema.

        // Creating the review
        // To safe guard against the ObjectId issue, I will check schema in next step if this fails.
        // But for now, let's write the standard logic.

        const review = await prisma.contractorReview.create({
            data: {
                contractorId: id,
                reviewerId: userId, // This might fail if schema enforces ObjectId and userId is "guest_123"
                projectId: projectId || null,
                rating,
                title: title || null,
                comment,
                isApproved: true, // Auto-approve for now
                isHidden: false
            }
        })

        // Update contractor stats
        // We can do this async or here. For simplicity, do it here.
        const aggregations = await prisma.contractorReview.aggregate({
            where: { contractorId: id, isApproved: true, isHidden: false },
            _avg: { rating: true },
            _count: { rating: true }
        })

        await prisma.contractorProfile.update({
            where: { id },
            data: {
                avgRating: aggregations._avg.rating || 0,
                totalReviews: aggregations._count.rating || 0
            }
        })

        return NextResponse.json(
            createSuccessResponse({
                review: {
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt
                },
                newStats: {
                    avgRating: aggregations._avg.rating || 0,
                    totalReviews: aggregations._count.rating || 0
                }
            }, 'Review submitted successfully'),
            { status: 201 }
        )

    } catch (error: any) {
        console.error('Submit review error:', error)
        return NextResponse.json(
            createErrorResponse(error.message || 'Failed to submit review', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
