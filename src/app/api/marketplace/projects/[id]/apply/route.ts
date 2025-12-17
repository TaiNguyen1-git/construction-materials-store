/**
 * Project Application API - Contractors apply to projects
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST /api/marketplace/projects/[id]/apply - Apply to a project
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const body = await request.json()

        const { message, proposedBudget, proposedDays, contractorId, portfolio } = body

        // Validation
        if (!message || !contractorId) {
            return NextResponse.json(
                createErrorResponse('Message and contractor ID required', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Check if project exists and is open
        const project = await prisma.constructionProject.findUnique({
            where: { id: projectId }
        })

        if (!project) {
            return NextResponse.json(
                createErrorResponse('Project not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        if (project.status !== 'OPEN') {
            return NextResponse.json(
                createErrorResponse('Project is not accepting applications', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Check if already applied
        const existingApplication = await prisma.projectApplication.findFirst({
            where: {
                projectId,
                contractorId
            }
        })

        if (existingApplication) {
            return NextResponse.json(
                createErrorResponse('You have already applied to this project', 'CONFLICT'),
                { status: 409 }
            )
        }

        // Create application
        const application = await prisma.projectApplication.create({
            data: {
                projectId,
                contractorId,
                message,
                proposedBudget: proposedBudget || null,
                proposedDays: proposedDays || null,
                portfolio: portfolio || [],
                status: 'PENDING'
            }
        })

        // Create notification for project owner
        await prisma.notification.create({
            data: {
                type: 'ORDER_NEW',
                title: 'Có nhà thầu ứng tuyển mới',
                message: `Dự án "${project.title}" có nhà thầu mới ứng tuyển`,
                priority: 'MEDIUM',
                read: false,
                userId: null
            }
        })

        return NextResponse.json(
            createSuccessResponse({ application }, 'Application submitted successfully'),
            { status: 201 }
        )
    } catch (error) {
        console.error('Apply to project error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to submit application', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}

// GET /api/marketplace/projects/[id]/apply - Get applications for a project
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params

        const applications = await prisma.projectApplication.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(
            createSuccessResponse({
                applications,
                total: applications.length
            }, 'Applications loaded'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get applications error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to load applications', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
