import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        const userId = payload?.userId || request.headers.get('x-user-id')

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get customer/contractor Profile
        const customer = await prisma.customer.findFirst({
            where: { userId: userId },
            include: { contractorProfile: true }
        })

        if (!customer) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // 1. Fetch active projects for this contractor
        const projects = await prisma.constructionProject.findMany({
            where: {
                // @ts-ignore - lat/lng exist in schema but Prisma Client sync might be delayed in IDE
                lat: { not: null },
                // @ts-ignore
                lng: { not: null }
            }
        })

        // 2. Fetch recent worker reports managed by this contractor
        const reports = await prisma.workerReport.findMany({
            where: {
                contractorId: customer.id, // Using customer.id modifed in schema
                // @ts-ignore
                lat: { not: null },
                // @ts-ignore
                lng: { not: null }
            },
            include: {
                project: {
                    select: {
                        title: true,
                        // @ts-ignore
                        lat: true,
                        // @ts-ignore
                        lng: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return NextResponse.json({
            success: true,
            data: {
                projects,
                reports
            }
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
