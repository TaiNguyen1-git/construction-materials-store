/**
 * API: Market Projects
 * GET - List marketplace projects
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        // Filters
        const status = searchParams.get('status')
        const projectType = searchParams.get('type')
        const city = searchParams.get('city')
        const isUrgent = searchParams.get('urgent')
        const search = searchParams.get('search')

        // Pagination  
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        const where: any = {}

        if (status) where.status = status
        if (projectType) where.projectType = projectType
        if (city) where.city = { contains: city, mode: 'insensitive' }
        if (isUrgent === 'true') where.isUrgent = true

        // Search in title or description
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        }

        // Get total count
        const total = await prisma.marketProject.count({ where })

        const projects = await prisma.marketProject.findMany({
            where,
            orderBy: [
                { isUrgent: 'desc' },
                { createdAt: 'desc' }
            ],
            skip,
            take: limit,
            include: {
                _count: {
                    select: { applications: true }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                projects,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        })

    } catch (error) {
        console.error('Error fetching projects:', error)
        return NextResponse.json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Lỗi khi lấy danh sách dự án' }
        }, { status: 500 })
    }
}
