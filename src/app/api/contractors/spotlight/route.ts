/**
 * Contractor Spotlight API - Update profile showcase
 * Supports: Bio, Skills, Featured Projects, Awards
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// GET /api/contractors/spotlight - Get current contractor's spotlight data
export async function GET(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        // Get customer
        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Customer not found', 'NOT_FOUND'), { status: 404 })
        }

        // Get contractor profile
        const profile = await prisma.contractorProfile.findFirst({
            where: { customerId: customer.id }
        })

        if (!profile) {
            return NextResponse.json(
                createSuccessResponse({
                    exists: false,
                    spotlight: null
                }, 'Chưa có hồ sơ nhà thầu'),
                { status: 200 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({
                exists: true,
                spotlight: {
                    displayName: profile.displayName,
                    bio: profile.bio,
                    highlightBio: profile.highlightBio,
                    skills: profile.skills,
                    experienceYears: profile.experienceYears,
                    teamSize: profile.teamSize,
                    city: profile.city,
                    district: profile.district,
                    awards: profile.awards,
                    featuredProjects: profile.featuredProjects,
                    portfolioImages: profile.portfolioImages,
                    portfolioDesc: profile.portfolioDesc,
                    isVerified: profile.isVerified,
                    trustScore: profile.trustScore,
                    avgRating: profile.avgRating,
                    totalProjectsCompleted: profile.totalProjectsCompleted
                }
            }, 'Dữ liệu Spotlight'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get spotlight error:', error)
        return NextResponse.json(createErrorResponse('Lỗi tải dữ liệu', 'SERVER_ERROR'), { status: 500 })
    }
}

// PUT /api/contractors/spotlight - Update spotlight data
export async function PUT(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const {
            highlightBio,
            bio,
            skills,
            experienceYears,
            teamSize,
            city,
            district,
            awards,
            featuredProjects,
            portfolioImages,
            portfolioDesc
        } = body

        // Get customer
        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Customer not found', 'NOT_FOUND'), { status: 404 })
        }

        // Find or create contractor profile
        let profile = await prisma.contractorProfile.findFirst({
            where: { customerId: customer.id }
        })

        const updateData = {
            highlightBio: highlightBio || null,
            bio: bio || null,
            skills: skills || [],
            experienceYears: experienceYears ? parseInt(experienceYears) : null,
            teamSize: teamSize ? parseInt(teamSize) : 1,
            city: city || null,
            district: district || null,
            awards: awards || [],
            featuredProjects: featuredProjects || null,
            portfolioImages: portfolioImages || [],
            portfolioDesc: portfolioDesc || []
        }

        if (profile) {
            // Update existing
            profile = await prisma.contractorProfile.update({
                where: { id: profile.id },
                data: updateData
            })
        } else {
            // Create new profile
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: { name: true, email: true, phone: true }
            })

            profile = await prisma.contractorProfile.create({
                data: {
                    customerId: customer.id,
                    displayName: user?.name || 'Nhà thầu',
                    email: user?.email,
                    phone: user?.phone,
                    ...updateData
                }
            })
        }

        return NextResponse.json(
            createSuccessResponse({ spotlight: profile }, 'Đã cập nhật Spotlight thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Update spotlight error:', error)
        return NextResponse.json(createErrorResponse('Lỗi cập nhật', 'SERVER_ERROR'), { status: 500 })
    }
}
