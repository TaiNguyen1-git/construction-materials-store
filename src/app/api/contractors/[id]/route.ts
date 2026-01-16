/**
 * Single Contractor API - Get contractor details
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
            where: { id }
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
                    customerId: contractor.customerId,
                    displayName: contractor.displayName,
                    bio: contractor.bio,
                    city: contractor.city,
                    district: contractor.district,
                    address: contractor.address,
                    phone: contractor.phone,
                    email: contractor.email,
                    skills: contractor.skills,
                    experienceYears: contractor.experienceYears,
                    teamSize: contractor.teamSize,
                    portfolioImages: contractor.portfolioImages,
                    portfolioDesc: contractor.portfolioDesc,
                    documents: contractor.documents,
                    isVerified: contractor.isVerified,
                    avgRating: contractor.avgRating,
                    totalReviews: contractor.reviewCount,
                    completedJobs: contractor.totalProjectsCompleted,
                    createdAt: contractor.createdAt
                },
                reviews: [] // Reviews will be loaded separately if needed
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
