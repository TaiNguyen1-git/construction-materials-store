/**
 * Marketplace Projects API - Contractor Marketplace
 * Different from /api/projects which is for internal Project management
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/marketplace/projects - List all open construction projects
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const city = searchParams.get('city')
        const status = searchParams.get('status') || 'OPEN'

        const where: any = {
            status
        }

        if (type) where.projectType = type
        if (city) where.city = city

        const projects = await prisma.constructionProject.findMany({
            where,
            include: {
                applications: {
                    select: { id: true }
                }
            },
            orderBy: [
                { isUrgent: 'desc' },
                { isFeatured: 'desc' },
                { createdAt: 'desc' }
            ]
        })

        // Format response
        const formattedProjects = projects.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            projectType: p.projectType,
            location: p.location,
            city: p.city,
            estimatedBudget: p.estimatedBudget,
            budgetType: p.budgetType,
            status: p.status,
            contactName: p.contactName,
            viewCount: p.viewCount,
            isUrgent: p.isUrgent,
            applicationCount: p.applications.length,
            createdAt: p.createdAt
        }))

        return NextResponse.json(
            createSuccessResponse({
                projects: formattedProjects,
                total: formattedProjects.length
            }, 'Projects loaded'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get marketplace projects error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to load projects', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}

// POST /api/marketplace/projects - Create new construction project
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            title,
            description,
            projectType,
            location,
            district,
            city,
            estimatedBudget,
            budgetType,
            requirements,
            materialsNeeded,
            contactName,
            contactPhone,
            contactEmail,
            customerId,
            isUrgent
        } = body

        // Validation
        if (!title || !description || !projectType || !location || !contactName || !contactPhone) {
            return NextResponse.json(
                createErrorResponse('Missing required fields', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const project = await prisma.constructionProject.create({
            data: {
                title,
                description,
                projectType,
                location,
                district: district || null,
                city: city || 'Biên Hòa',
                estimatedBudget: estimatedBudget || null,
                budgetType: budgetType || 'NEGOTIABLE',
                requirements: requirements || [],
                materialsNeeded: materialsNeeded || [],
                images: [],
                contactName,
                contactPhone,
                contactEmail: contactEmail || null,
                customerId: customerId || 'guest',
                isUrgent: isUrgent || false,
                status: 'OPEN'
            }
        })

        // Notify matching contractors (non-blocking)
        import('@/lib/notification-service').then(({ notifyMatchingContractors }) => {
            notifyMatchingContractors({
                id: project.id,
                title: project.title,
                projectType: project.projectType,
                city: project.city,
                district: project.district,
                estimatedBudget: project.estimatedBudget,
                isUrgent: project.isUrgent
            }).catch(err => console.error('Notify contractors error:', err))
        }).catch(err => console.error('Import notification service error:', err))

        return NextResponse.json(
            createSuccessResponse({ project }, 'Project created successfully'),
            { status: 201 }
        )
    } catch (error) {
        console.error('Create marketplace project error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to create project', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
