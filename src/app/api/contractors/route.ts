/**
 * Contractors API - List and search contractor profiles
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/contractors - List all contractors
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        // Filters
        const skill = searchParams.get('skill')
        const city = searchParams.get('city')
        const verified = searchParams.get('verified')
        const minRating = searchParams.get('minRating')
        const search = searchParams.get('search')

        // Pagination
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: any = {}

        if (skill) where.skills = { has: skill }
        if (city) where.city = { contains: city, mode: 'insensitive' }
        if (verified === 'true') where.isVerified = true
        if (minRating) where.avgRating = { gte: parseFloat(minRating) }

        // Search by name or bio
        if (search) {
            where.OR = [
                { displayName: { contains: search, mode: 'insensitive' } },
                { bio: { contains: search, mode: 'insensitive' } }
            ]
        }

        // Get total count for pagination
        const total = await prisma.contractorProfile.count({ where })

        const contractors = await prisma.contractorProfile.findMany({
            where,
            orderBy: [
                { isVerified: 'desc' },
                { avgRating: 'desc' },
                { completedJobs: 'desc' }
            ],
            skip,
            take: limit
        })

        return NextResponse.json(
            createSuccessResponse({
                contractors,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }, 'Contractors loaded'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get contractors error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to load contractors', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}

// POST /api/contractors - Create contractor profile
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            customerId,
            displayName,
            bio,
            phone,
            email,
            address,
            district,
            city,
            skills,
            experienceYears,
            teamSize
        } = body

        if (!customerId || !displayName) {
            return NextResponse.json(
                createErrorResponse('Customer ID and display name required', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Check if profile already exists
        const existing = await prisma.contractorProfile.findUnique({
            where: { customerId }
        })

        if (existing) {
            return NextResponse.json(
                createErrorResponse('Profile already exists', 'CONFLICT'),
                { status: 409 }
            )
        }

        const profile = await prisma.contractorProfile.create({
            data: {
                customerId,
                displayName,
                bio: bio || null,
                phone: phone || null,
                email: email || null,
                address: address || null,
                district: district || null,
                city: city || 'Biên Hòa',
                skills: skills || [],
                experienceYears: experienceYears || 0,
                teamSize: teamSize || 1,
                portfolioImages: [],
                portfolioDesc: [],
                documents: []
            }
        })

        return NextResponse.json(
            createSuccessResponse({ profile }, 'Profile created'),
            { status: 201 }
        )
    } catch (error) {
        console.error('Create contractor profile error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to create profile', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
