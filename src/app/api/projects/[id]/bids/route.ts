import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveNotificationForUser } from '@/lib/notification-service'
import { z } from 'zod'

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
    const body = await request.json()
    const validation = bidSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.format() }, { status: 400 })
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })

    const existingBid = await prisma.projectBid.findFirst({
        where: { projectId, contractorId: validation.data.contractorId }
    })

    if (existingBid) {
        return NextResponse.json({ success: false, error: 'Bạn đã nộp thầu cho dự án này rồi' }, { status: 400 })
    }

    const bid = await prisma.projectBid.create({
      data: {
        projectId,
        ...validation.data,
        status: 'PENDING'
      }
    })

    // Notify project owner
    if (project.customerId) {
        const owner = await prisma.customer.findUnique({
            where: { id: project.customerId },
            select: { userId: true }
        })
        if (owner?.userId) {
            await saveNotificationForUser({
                type: 'ORDER_UPDATE' as any,
                priority: 'HIGH',
                title: '🏗️ Gói thầu mới!',
                message: `Có gói thầu mới trị giá ${validation.data.amount.toLocaleString()}đ cho dự án "${project.name}"`,
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
