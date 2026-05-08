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

        // === Source 1: ConstructionProject (native marketplace projects) ===
        const cpWhere: any = { status }
        if (type) cpWhere.projectType = type
        if (city) cpWhere.city = city

        const constructionProjects = await prisma.constructionProject.findMany({
            where: cpWhere,
            include: { applications: { select: { id: true } } },
            orderBy: [{ isUrgent: 'desc' }, { isFeatured: 'desc' }, { createdAt: 'desc' }]
        })

        const fromConstruction = constructionProjects.map(p => ({
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
            createdAt: p.createdAt,
            _source: 'construction'
        }))

        // === Source 2: Internal Project (isPublic + APPROVED) — uses ProjectBid ===
        const internalWhere: any = {
            isPublic: true,
            moderationStatus: 'APPROVED'
        }
        if (city) internalWhere.location = { contains: city }

        const internalProjects = await (prisma as any).project.findMany({
            where: internalWhere,
            include: {
                bids: { select: { id: true } },
                customer: { select: { user: { select: { name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        })

        const fromInternal = internalProjects.map((p: any) => ({
            id: p.id,
            title: p.name,
            description: p.description || '',
            projectType: p.category || 'general',
            location: p.location || '',
            city: p.location?.split(',').pop()?.trim() || 'Toàn quốc',
            estimatedBudget: p.budget || null,
            budgetType: 'NEGOTIABLE',
            status: p.status || 'OPEN',
            contactName: p.guestName || p.customer?.user?.name || 'Khách hàng',
            viewCount: 0,
            isUrgent: p.priority === 'HIGH' || p.priority === 'URGENT',
            applicationCount: p.bids?.length ?? 0,
            createdAt: p.createdAt,
            _source: 'internal'
        }))

        // Merge, deduplicate by ID, sort by date
        const allProjects = [...fromConstruction, ...fromInternal]
            .filter((p, idx, arr) => arr.findIndex(x => x.id === p.id) === idx)
            .sort((a, b) => {
                if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            })
            .map(({ _source, ...p }) => p) // strip internal _source field

        const limit = parseInt(searchParams.get('limit') || '50')
        const slicedProjects = allProjects.slice(0, limit)

        return NextResponse.json(
            createSuccessResponse({
                projects: slicedProjects,
                total: allProjects.length
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
