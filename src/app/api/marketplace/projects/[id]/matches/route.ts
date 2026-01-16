/**
 * Project Matching API - Find matching contractors for a project
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findMatchingContractors, getMatchQuality } from '@/lib/matching-service'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/marketplace/projects/[id]/matches - Get matching contractors for a project
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Get project
        const project = await prisma.constructionProject.findUnique({
            where: { id }
        })

        if (!project) {
            return NextResponse.json(
                createErrorResponse('Project not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Get all available contractors
        const contractors = await prisma.contractorProfile.findMany({
            where: { isAvailable: true }
        })

        // Find matches using local algorithm
        const matches = findMatchingContractors(
            contractors.map(c => ({
                id: c.id,
                displayName: c.displayName,
                skills: c.skills,
                city: c.city || 'Biên Hòa',
                district: c.district || '',
                experienceYears: c.experienceYears || 0,
                teamSize: c.teamSize || 1,
                isVerified: c.isVerified,
                avgRating: c.avgRating,
                totalReviews: c.reviewCount,
                completedJobs: c.totalProjectsCompleted,
                isAvailable: c.isAvailable
            })),
            {
                id: project.id,
                title: project.title,
                projectType: project.projectType,
                city: project.city,
                district: project.district
            },
            10 // Return top 10 matches
        )

        // Add quality labels
        const matchesWithQuality = matches.map(m => ({
            ...m,
            quality: getMatchQuality(m.score)
        }))

        return NextResponse.json(
            createSuccessResponse({
                project: {
                    id: project.id,
                    title: project.title,
                    projectType: project.projectType
                },
                matches: matchesWithQuality,
                totalContractors: contractors.length
            }, 'Matching contractors found'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Matching error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to find matches', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
