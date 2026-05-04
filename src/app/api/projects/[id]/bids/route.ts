import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveNotificationForUser } from '@/lib/notification-service'
import { z } from 'zod'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

const bidSchema = z.object({
  contractorId: z.string(),
  amount: z.number().positive(),
  completionDays: z.number().positive(),
  message: z.string().optional(),
  boq: z.array(z.object({
    item: z.string(),
    unit: z.string(),
    quantity: z.number(),
    price: z.number()
  })).optional(),
  milestones: z.array(z.object({
    name: z.string(),
    percentage: z.number()
  })).optional(),
  attachments: z.array(z.string()).optional(),
  validUntil: z.string().optional().transform(s => s ? new Date(s) : undefined)
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const bids = await prisma.projectBid.findMany({
      where: { projectId },
      include: {
        contractor: {
          include: {
            user: { select: { name: true } },
            contractorProfile: { select: { displayName: true, avgRating: true, totalProjectsCompleted: true } }
          }
        }
      },
      orderBy: { amount: 'asc' }
    })

    return NextResponse.json({ success: true, data: bids })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const payload = verifyTokenFromRequest(request)
    if (!payload?.userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Find the contractor profile for this user (ensure they are a contractor)
    if (payload.role !== 'CONTRACTOR') {
        return NextResponse.json({ success: false, error: 'Chỉ nhà thầu mới có thể nộp hồ sơ' }, { status: 403 })
    }

    const contractor = await prisma.customer.findFirst({
        where: { userId: payload.userId }
    })

    if (!contractor) {
        return NextResponse.json({ success: false, error: 'Chỉ nhà thầu mới có thể nộp hồ sơ' }, { status: 403 })
    }

    const body = await request.json()
    // Inject contractorId if missing or ensure it matches
    body.contractorId = contractor.id
    
    const validation = bidSchema.safeParse(body)

    if (!validation.success) {
        return NextResponse.json({ success: false, error: 'Dữ liệu không hợp lệ', details: validation.error.format() }, { status: 400 })
    }

    // Try to find the project in any of the possible tables
    let targetProject: any = await prisma.project.findUnique({ where: { id: projectId } })
    let projectType: 'PROJECT' | 'CONSTRUCTION' = 'PROJECT'

    if (!targetProject) {
        targetProject = await prisma.constructionProject.findUnique({ where: { id: projectId } })
        if (targetProject) projectType = 'CONSTRUCTION'
    }

    if (!targetProject) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy dự án' }, { status: 404 })
    }

    // ConstructionProject uses ProjectApplication (not ProjectBid)
    if (projectType === 'CONSTRUCTION') {
        const existingApp = await prisma.projectApplication.findFirst({
            where: { projectId, contractorId: contractor.id }
        })
        if (existingApp) {
            return NextResponse.json({ success: false, error: 'Bạn đã nộp thầu cho dự án này rồi' }, { status: 400 })
        }

        const application = await prisma.projectApplication.create({
            data: {
                projectId,
                contractorId: contractor.id,
                message: validation.data.message || '',
                proposedBudget: validation.data.amount,
                proposedDays: validation.data.completionDays,
                materials: validation.data.boq ?? undefined,
                attachments: validation.data.attachments ?? [],
                status: 'PENDING'
            }
        })

        // Notify project owner
        const ownerId = targetProject.customerId
        if (ownerId && ownerId !== 'guest') {
            const owner = await prisma.customer.findFirst({
                where: { userId: ownerId },
                select: { userId: true }
            }).catch(() => null)
            if (owner?.userId) {
                await saveNotificationForUser({
                    type: 'ORDER_UPDATE' as any,
                    priority: 'HIGH',
                    title: '🏗️ Gói thầu mới!',
                    message: `Có gói thầu mới trị giá ${validation.data.amount.toLocaleString()}đ cho dự án "${targetProject.title}"`,
                    data: { projectId, applicationId: application.id }
                }, owner.userId, 'CUSTOMER')
            }
        }

        return NextResponse.json({ success: true, data: application, message: 'Nộp thầu thành công' })
    }

    // For PROJECT type — use ProjectBid
    const existingBid = await prisma.projectBid.findFirst({
        where: { projectId, contractorId: contractor.id }
    })

    if (existingBid) {
        return NextResponse.json({ success: false, error: 'Bạn đã nộp thầu cho dự án này rồi' }, { status: 400 })
    }

    const bid = await prisma.projectBid.create({
      data: {
        projectId,
        ...validation.data,
        contractorId: contractor.id,
        status: 'PENDING'
      }
    })

    // Notify project owner
    const customerId = targetProject.customerId
    if (customerId) {
        const owner = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { userId: true }
        })
        if (owner?.userId) {
            const projectName = targetProject.name || targetProject.title || 'Dự án'
            await saveNotificationForUser({
                type: 'ORDER_UPDATE' as any,
                priority: 'HIGH',
                title: '🏗️ Gói thầu mới!',
                message: `Có gói thầu mới trị giá ${validation.data.amount.toLocaleString()}đ cho dự án "${projectName}"`,
                data: { projectId, bidId: bid.id }
            }, owner.userId, 'CUSTOMER')
        }
    }

    return NextResponse.json({ success: true, data: bid, message: 'Nộp thầu thành công' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
