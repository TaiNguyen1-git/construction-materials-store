import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload || (payload.role !== 'MANAGER' && payload.role !== 'EMPLOYEE')) {
            return NextResponse.json(createErrorResponse('Unauthorized access', 'UNAUTHORIZED'), { status: 401 })
        }

        const organizations = await (prisma as any).organization.findMany({
            include: {
                _count: {
                    select: { members: true, orders: true }
                },
                members: {
                    where: { role: 'OWNER' },
                    include: {
                        user: {
                            select: { name: true, email: true, phone: true }
                        }
                    },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const formattedOrgs = organizations.map((org: any) => ({
            id: org.id,
            name: org.name,
            taxCode: org.taxCode,
            address: org.address,
            memberCount: org._count.members,
            orderCount: org._count.orders,
            owner: org.members[0]?.user || { name: 'Unknown', email: 'N/A' },
            createdAt: org.createdAt,
            isActive: org.isActive
        }))

        return NextResponse.json(createSuccessResponse(formattedOrgs))

    } catch (error: any) {
        console.error('Admin Org Fetch Error:', error)
        return NextResponse.json(createErrorResponse('Failed to fetch organizations', 'SERVER_ERROR'), { status: 500 })
    }
}
