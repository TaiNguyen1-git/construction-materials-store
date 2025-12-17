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

        const project = await prisma.constructionProject.findUnique({
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
        })

        if (!project) {
            return NextResponse.json(
                createErrorResponse('Project not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Increment view count
        await prisma.constructionProject.update({
            where: { id },
            data: { viewCount: project.viewCount + 1 }
        })

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
