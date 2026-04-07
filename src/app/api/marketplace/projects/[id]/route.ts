/**
 * Single Project API - Get details and apply
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/marketplace/projects/[id] - Get project details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Validate ObjectID format to prevent Prisma crash (P2023)
        if (!/^[a-f\d]{24}$/i.test(id)) {
            return NextResponse.json(
                createErrorResponse('Invalid project ID format', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        let project = await prisma.constructionProject.findUnique({
            where: { id },
            include: {
                applications: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        }) as any

        // Fallback to internal Project if not found in marketplace
        if (!project) {
            const internalProject = await (prisma as any).project.findUnique({
                where: { id },
                include: {
                    customer: { select: { user: { select: { name: true } } } }
                }
            })

            if (internalProject) {
                // Map internal Project to marketplace format
                project = {
                    id: internalProject.id,
                    title: internalProject.name,
                    description: internalProject.description || '',
                    projectType: internalProject.category || 'OTHER',
                    location: internalProject.location || '',
                    city: internalProject.location?.split(',').pop()?.trim() || 'Biên Hòa',
                    estimatedBudget: internalProject.budget,
                    budgetType: 'NEGOTIABLE',
                    requirements: [],
                    materialsNeeded: [],
                    contactName: internalProject.guestName || internalProject.customer?.user?.name || 'Khách hàng',
                    status: internalProject.status,
                    isUrgent: false,
                    viewCount: internalProject.progress, // dummy or other metric
                    createdAt: internalProject.createdAt,
                    applications: []
                }
            }
        }

        if (!project) {
            return NextResponse.json(
                createErrorResponse('Project not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Increment view count if it's a real construction project
        if (project.viewCount !== undefined && (!project.status || project.status === 'OPEN')) {
            try {
                await prisma.constructionProject.update({
                    where: { id },
                    data: { viewCount: (project.viewCount || 0) + 1 }
                }).catch(() => { /* Ignore fallback errors */ })
            } catch (e) {}
        }

        return NextResponse.json(
            createSuccessResponse(project, 'Project loaded'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get project error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to load project', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
