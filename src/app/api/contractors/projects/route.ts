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

        const projects = await prisma.constructionProject.findMany({
            where: {
                customerId: customer.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(createSuccessResponse(projects))
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
            return NextResponse.json(createErrorResponse('Customer profile not found', 'NOT_FOUND'), { status: 404 })
        }

        const body = await request.json()
        const { title, description, projectType, location, city, district, estimatedBudget, contactName, contactPhone, startDate } = body

        if (!title) {
            return NextResponse.json(createErrorResponse('Tên dự án là bắt buộc', 'VALIDATION_ERROR'), { status: 400 })
        }

        const project = await prisma.constructionProject.create({
            data: {
                title,
                description: description || '',
                projectType,
                location: location || '',
                city: city || 'Hồ Chí Minh',
                district: district || '',
                estimatedBudget: estimatedBudget || 0,
                contactName,
                contactPhone,
                customerId: customer.id, // Linked to the contractor creator
                status: 'IN_PROGRESS', // Default to active
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        return NextResponse.json(createSuccessResponse(project, 'Đã tạo dự án thành công'))
    } catch (error) {
        console.error('Create project error:', error)
        return NextResponse.json(createErrorResponse('Lỗi khi tạo dự án', 'SERVER_ERROR'), { status: 500 })
    }
}
