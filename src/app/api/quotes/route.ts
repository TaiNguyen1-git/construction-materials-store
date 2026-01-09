import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'

const createQuoteRequestSchema = z.object({
    contractorId: z.string(),
    details: z.string().min(10, 'Mô tả cần chi tiết hơn'),
    budget: z.number().optional(),
    location: z.string().optional(),
    startDate: z.string().optional(), // ISO date string
    projectId: z.string().optional()
})

// GET /api/quotes - List quotes for current user (either sent or received)
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'sent' or 'received'

        // Find customer record for this user
        const customer = await prisma.customer.findFirst({
            where: { userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Customer profile not found', 'NOT_FOUND'), { status: 404 })
        }

        let where: any = {}

        if (type === 'received') {
            // As a contractor
            where.contractorId = customer.id
        } else {
            // As a customer (default)
            where.customerId = customer.id
        }

        // Fetch quotes without relations first
        const quotesRaw = await prisma.quoteRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        })

        // Manually fetch related data
        const customerIds: string[] = Array.from(new Set(quotesRaw.map((q: any) => String(q.customerId))))
        const contractorIds: string[] = Array.from(new Set(quotesRaw.map((q: any) => String(q.contractorId))))
        const projectIds: string[] = Array.from(new Set(quotesRaw.map((q: any) => q.projectId).filter(Boolean).map((id: any) => String(id))))

        const [customers, contractors, projects] = await Promise.all([
            prisma.customer.findMany({
                where: { id: { in: customerIds } },
                include: { user: { select: { name: true, email: true, phone: true } } }
            }),
            prisma.customer.findMany({
                where: { id: { in: contractorIds } },
                include: { user: { select: { name: true } } }
            }),
            prisma.project.findMany({
                where: { id: { in: projectIds } },
                select: { id: true, name: true }
            })
        ])

        const customerMap = new Map(customers.map(c => [c.id, c]))
        const contractorMap = new Map(contractors.map(c => [c.id, c]))
        const projectMap = new Map(projects.map(p => [p.id, p]))

        // Map data back
        const quotes = quotesRaw.map((quote: any) => {
            const cust = customerMap.get(quote.customerId as string)
            const cont = contractorMap.get(quote.contractorId as string)
            const proj = quote.projectId ? projectMap.get(quote.projectId as string) : null

            return {
                ...quote,
                customer: cust ? {
                    id: cust.id,
                    user: (cust as any).user
                } : null,
                contractor: cont ? {
                    id: cont.id,
                    user: (cont as any).user,
                    companyName: cont.companyName
                } : null,
                project: proj ? {
                    name: proj.name
                } : null
            }
        })

        return NextResponse.json(createSuccessResponse(quotes))
    } catch (error: any) {
        console.error('Get quotes error:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
    }
}

// POST /api/quotes - Create new quote request
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const validation = createQuoteRequestSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Invalid input', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { contractorId, details, budget, location, startDate, projectId } = validation.data

        // Find customer record
        const customer = await prisma.customer.findFirst({
            where: { userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Please complete your profile first', 'PROFILE_MISSING'), { status: 400 })
        }

        if (customer.id === contractorId) {
            return NextResponse.json(createErrorResponse('Cannot request quote from yourself', 'INVALID_OPERATION'), { status: 400 })
        }

        const quote = await prisma.quoteRequest.create({
            data: {
                customerId: customer.id,
                contractorId,
                details,
                budget,
                location,
                startDate: startDate ? new Date(startDate) : undefined,
                projectId,
                status: 'PENDING'
            }
        })

        return NextResponse.json(createSuccessResponse(quote, 'Gửi yêu cầu báo giá thành công'), { status: 201 })

    } catch (error: any) {
        console.error('Create quote error:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
    }
}
