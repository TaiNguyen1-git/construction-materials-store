import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// GET /api/contractors/projects - List all projects for the logged-in contractor
export async function GET(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Contractor profile not found', 'NOT_FOUND'), { status: 404 })
        }

        // Check for organization memberships
        const memberships = await prisma.organizationMember.findMany({
            where: { userId: payload.userId },
            select: { organizationId: true }
        })
        const orgIds = memberships.map(m => m.organizationId)

        // Fetch projects where the user is either the Contractor OR the Owner (Customer) OR part of Organization
        const projects = await (prisma.project as any).findMany({
            where: {
                OR: [
                    { contractorId: customer.id },
                    { customerId: customer.id },
                    { organizationId: { in: orgIds } }
                ]
            },
            include: {
                customer: {
                    include: { user: true }
                },
                organization: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Map Project fields to the expected format (ContractorProject)
        const mappedProjects = projects.map((p: any) => ({
            id: p.id,
            title: p.name,
            description: p.description || '',
            status: p.status,
            createdAt: p.createdAt,
            estimatedBudget: p.budget,
            // Contact info: Priority to Guest info, then Customer (Owner) info
            contactName: p.guestName || p.customer?.user?.name || (p.customerId === customer.id ? 'Tôi (Chủ dự án)' : 'Khách hàng'),
            contactPhone: p.guestPhone || p.customer?.user?.phone || '',
            city: p.location || 'Hồ Chí Minh',
            district: '',
            // Metrics
            taskCompletion: p.progress,
            totalTasks: 0,
            completedTasks: 0,
            orderCount: 0,
            // Organization Info
            organization: p.organization ? {
                id: p.organization.id,
                name: p.organization.name
            } : null
        }))

        return NextResponse.json(createSuccessResponse(mappedProjects))
    } catch (error) {
        console.error('Fetch projects error:', error)
        return NextResponse.json(createErrorResponse('Failed to fetch projects', 'SERVER_ERROR'), { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Contractor profile not found', 'NOT_FOUND'), { status: 404 })
        }

        const body = await request.json()
        const { title, description, projectType, location, city, district, estimatedBudget, contactName, contactPhone, startDate } = body

        if (!title) {
            return NextResponse.json(createErrorResponse('Tên dự án là bắt buộc', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Create new Project in the correct table
        const project = await prisma.project.create({
            data: {
                name: title,
                description: description || '',
                category: projectType || 'general',
                status: 'IN_PROGRESS',
                startDate: startDate ? new Date(startDate) : new Date(),
                budget: Number(estimatedBudget) || 0,
                location: `${district ? district + ', ' : ''}${city || 'Hồ Chí Minh'}`,

                // The logged-in contractor is the 'contractor' of this project
                contractorId: customer.id,

                // The 'Customer' is the end-client (Guest)
                guestName: contactName,
                guestPhone: contactPhone,

                // Allow the contractor to be the 'owner' as well for management purposes
                customerId: customer.id,

                isPublic: false,
                priority: 'MEDIUM'
            }
        })

        return NextResponse.json(createSuccessResponse(project, 'Đã tạo dự án thành công'))
    } catch (error) {
        console.error('Create project error:', error)
        return NextResponse.json(createErrorResponse('Lỗi khi tạo dự án', 'SERVER_ERROR'), { status: 500 })
    }
}
