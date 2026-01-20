
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
    try {
        // Mock authentication (in real app, extract from session/headers)
        // For demo, we might need a way to identify the contractor. 
        // I will assume a default contractor ID or fetch based on a query param for testing, 
        // or cleaner: use the existing auth pattern if available.
        // Given complexity, I'll fetch the first Contractor-User found or use a hardcoded demo ID if strict auth is missing.

        // Let's assume we pass ?contractorId=... or try to find one.
        const searchParams = request.nextUrl.searchParams
        let contractorId = searchParams.get('contractorId')

        if (!contractorId) {
            // Fallback for demo: find the first contractor profile
            const demoContractor = await (prisma as any).contractorProfile.findFirst()
            if (demoContractor) contractorId = demoContractor.customerId // Profile links to Customer
        }

        if (!contractorId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        // 1. Get Projects (ConstructionProject, which supports report tokens)
        const projects = await (prisma as any).constructionProject.findMany({
            where: {
                // For ConstructionProject, contractorId might be nullable or different semantics
                // But let's assume we find projects where this contractor is assigned OR is the customer?
                // The schema says `contractorId String?`.
                // Also `ProjectApplication` links contractors to projects. 
                // BUT, for simplicity in this "Team Dashboard", let's assume we are looking for projects where this user is the contractor.
                // OR projects created by this user if they act as a "General Contractor" managing sub-contractors?
                // Given the context is "Contractor Team Page", it's likely projects they are managing.
                // Let's match based on `contractorId` if it exists, or created by them if they are the owner?
                // The logical link is `contractorId`.
                contractorId: contractorId,
                status: { in: ['OPEN', 'IN_PROGRESS', 'PLANNING'] } // ConstructionProject uses OPEN/IN_PROGRESS etc.
            },
            select: {
                id: true,
                title: true, // ConstructionProject uses 'title'
                status: true,
                reportTokens: {
                    where: { isActive: true },
                    take: 1
                }
            }
        })

        // 2. Get Pending Material Requests
        const pendingRequests = await (prisma as any).siteMaterialRequest.findMany({
            where: {
                contractorId: contractorId,
                status: 'PENDING'
            },
            include: {
                project: { select: { title: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // 3. Get Worker Activity (Recent Reports)
        const recentReports = await (prisma as any).workerReport.findMany({
            where: {
                contractorId: contractorId
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                project: { select: { title: true } }
            }
        })

        return NextResponse.json(createSuccessResponse({
            projects: projects.map((p: any) => ({
                id: p.id,
                name: p.title,
                status: p.status,
                // If no token exists, one might need to be generated on the client
                activeToken: p.reportTokens?.[0]?.token || null
            })),
            requests: pendingRequests,
            reports: recentReports
        }))

    } catch (error) {
        console.error('Team Dashboard Error:', error)
        return NextResponse.json(createErrorResponse('Lỗi tải dữ liệu team', 'SERVER_ERROR'), { status: 500 })
    }
}
