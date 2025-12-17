/**
 * Single Contractor API - Get contractor details and reviews
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/contractors/[id] - Get contractor details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const contractor = await prisma.contractorProfile.findUnique({
            where: { id },
            include: {
                reviews: {
                    where: { isApproved: true, isHidden: false },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        })

        if (!contractor) {
            return NextResponse.json(
                createErrorResponse('Contractor not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({
                contractor: {
                    id: contractor.id,
                    displayName: contractor.displayName,
                    bio: contractor.bio,
                    avatar: contractor.avatar,
                    city: contractor.city,
                    district: contractor.district,
                    phone: contractor.phone,
                    email: contractor.email,
                    skills: contractor.skills,
                    experienceYears: contractor.experienceYears,
                    teamSize: contractor.teamSize,
                    isVerified: contractor.isVerified,
                    avgRating: contractor.avgRating,
                    totalReviews: contractor.totalReviews,
                    completedJobs: contractor.completedJobs,
                    isAvailable: contractor.isAvailable,
                    createdAt: contractor.createdAt
                },
                reviews: contractor.reviews.map(r => ({
                    id: r.id,
                    rating: r.rating,
                    title: r.title,
                    comment: r.comment,
                    createdAt: r.createdAt
                }))
            }, 'Contractor loaded'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get contractor error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to load contractor', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
