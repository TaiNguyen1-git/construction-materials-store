/**
 * API: Escrow Operations for Payment Milestones
 * POST /api/milestones/[id]/escrow
 * 
 * Actions:
 * - DEPOSIT: Customer deposits money into escrow
 * - RELEASE: Release money to contractor after work approval
 * - STATUS: Get current escrow status
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { action, amount, paymentMethod, proofUrl, notes } = body

        // Fetch milestone with related data
        const milestone = await (prisma.paymentMilestone.findUnique({
            where: { id },
            include: {
                quote: {
                    include: {
                        customer: {
                            include: { user: { select: { name: true, email: true } } }
                        },
                        contractor: {
                            include: { user: { select: { name: true, email: true } } }
                        }
                    }
                },
                workerReports: true
            }
        }) as any)

        if (!milestone) {
            return NextResponse.json(
                { error: { message: 'Không tìm thấy milestone' } },
                { status: 404 }
            )
        }

        switch (action) {
            case 'DEPOSIT':
                return handleDeposit(milestone, { amount, paymentMethod, proofUrl, notes })

            case 'RELEASE':
                return handleRelease(milestone, { notes })

            case 'STATUS':
                return getEscrowStatus(milestone)

            default:
                return NextResponse.json(
                    { error: { message: 'Invalid action' } },
                    { status: 400 }
                )
        }

    } catch (error) {
        console.error('Error processing escrow operation:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi xử lý giao dịch escrow' } },
            { status: 500 }
        )
    }
}

async function handleDeposit(
    milestone: any,
    data: { amount?: number; paymentMethod?: string; proofUrl?: string; notes?: string }
) {
    // Validate milestone status
    if (milestone.status !== 'PENDING') {
        return NextResponse.json(
            { error: { message: 'Milestone này đã được thanh toán hoặc đang xử lý' } },
            { status: 400 }
        )
    }

    const depositAmount = data.amount || milestone.amount

    // Validate amount
    if (depositAmount < milestone.amount) {
        return NextResponse.json(
            { error: { message: `Số tiền tối thiểu cần nộp là ${milestone.amount.toLocaleString('vi-VN')}đ` } },
            { status: 400 }
        )
    }

    // Update milestone to ESCROW_PAID status
    const updatedMilestone = await (prisma.paymentMilestone.update({
        where: { id: milestone.id },
        data: {
            status: 'ESCROW_PAID',
            paidAt: new Date(),
            evidenceNotes: `Đã nộp ${depositAmount.toLocaleString('vi-VN')}đ vào escrow. ${data.notes || ''}`
        } as any
    }) as any)

    // Create notification for contractor
    await prisma.notification.create({
        data: {
            title: '💰 Khách hàng đã nộp tiền escrow',
            message: `Milestone "${milestone.name}" đã được nộp ${depositAmount.toLocaleString('vi-VN')}đ vào escrow. Hãy hoàn thành công việc để nhận tiền.`,
            type: 'PAYMENT_UPDATE',
            priority: 'HIGH',
            referenceId: milestone.quoteId,
            referenceType: 'QUOTE'
        }
    })

    return NextResponse.json({
        success: true,
        message: 'Đã nộp tiền vào escrow thành công',
        data: {
            milestoneId: milestone.id,
            milestoneName: milestone.name,
            amount: depositAmount,
            status: 'ESCROW_PAID',
            paidAt: new Date().toISOString()
        }
    })
}

async function handleRelease(
    milestone: any,
    data: { notes?: string }
) {
    // Validate milestone status
    if (milestone.status !== 'ESCROW_PAID') {
        return NextResponse.json(
            { error: { message: 'Milestone này chưa được nộp tiền escrow hoặc đã được giải ngân' } },
            { status: 400 }
        )
    }

    // Check if there are approved worker reports
    const approvedReports = milestone.workerReports.filter(
        (r: any) => r.customerStatus === 'APPROVED' || r.status === 'APPROVED'
    )

    if (approvedReports.length === 0) {
        return NextResponse.json(
            { error: { message: 'Cần có ít nhất 1 báo cáo công việc được phê duyệt trước khi giải ngân' } },
            { status: 400 }
        )
    }

    // Update milestone to RELEASED status
    const updatedMilestone = await (prisma.paymentMilestone.update({
        where: { id: milestone.id },
        data: {
            status: 'RELEASED',
            evidenceNotes: (milestone.evidenceNotes || '') + ` | Giải ngân: ${data.notes || 'Đã xác nhận hoàn thành'}`
        } as any
    }) as any)

    // Update contractor's trust score (simple increment)
    const contractorProfile = await prisma.contractorProfile.findFirst({
        where: { customerId: milestone.quote.contractorId }
    })

    if (contractorProfile) {
        await prisma.contractorProfile.update({
            where: { id: contractorProfile.id },
            data: {
                totalProjectsCompleted: { increment: 1 },
                trustScore: Math.min(100, (contractorProfile.trustScore || 80) + 2)
            }
        })
    }

    // Create notification for contractor
    await prisma.notification.create({
        data: {
            title: '🎉 Tiền đã được giải ngân!',
            message: `Milestone "${milestone.name}" đã được khách hàng xác nhận. ${milestone.amount.toLocaleString('vi-VN')}đ đã được chuyển cho bạn.`,
            type: 'PAYMENT_UPDATE',
            priority: 'HIGH',
            referenceId: milestone.quoteId,
            referenceType: 'QUOTE'
        }
    })

    // Create notification for customer
    await prisma.notification.create({
        data: {
            title: '✅ Giải ngân thành công',
            message: `Bạn đã giải ngân ${milestone.amount.toLocaleString('vi-VN')}đ cho milestone "${milestone.name}".`,
            type: 'PAYMENT_UPDATE',
            priority: 'MEDIUM',
            referenceId: milestone.quoteId,
            referenceType: 'QUOTE'
        }
    })

    return NextResponse.json({
        success: true,
        message: 'Đã giải ngân thành công',
        data: {
            milestoneId: milestone.id,
            milestoneName: milestone.name,
            amount: milestone.amount,
            status: 'RELEASED',
            contractorTrustScore: contractorProfile ? contractorProfile.trustScore + 2 : null
        }
    })
}

async function getEscrowStatus(milestone: any) {
    const approvedReports = milestone.workerReports.filter(
        (r: any) => r.customerStatus === 'APPROVED' || r.status === 'APPROVED'
    )

    const pendingReports = milestone.workerReports.filter(
        (r: any) => r.customerStatus === 'PENDING' || r.status === 'PENDING'
    )

    return NextResponse.json({
        success: true,
        data: {
            milestoneId: milestone.id,
            milestoneName: milestone.name,
            amount: milestone.amount,
            percentage: milestone.percentage,
            status: milestone.status,
            paidAt: milestone.paidAt,

            // Escrow details
            escrow: {
                isDeposited: milestone.status === 'ESCROW_PAID' || milestone.status === 'RELEASED',
                isReleased: milestone.status === 'RELEASED',
                canRelease: milestone.status === 'ESCROW_PAID' && approvedReports.length > 0
            },

            // Work verification
            verification: {
                totalReports: milestone.workerReports.length,
                approvedReports: approvedReports.length,
                pendingReports: pendingReports.length,
                hasEvidence: milestone.evidenceUrl || approvedReports.length > 0
            },

            // Participants
            customer: milestone.quote.customer.user.name,
            contractor: milestone.quote.contractor.user.name
        }
    })
}

// GET endpoint for fetching escrow status
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const milestone = await (prisma.paymentMilestone.findUnique({
            where: { id },
            include: {
                quote: {
                    include: {
                        customer: {
                            include: { user: { select: { name: true } } }
                        },
                        contractor: {
                            include: { user: { select: { name: true } } }
                        }
                    }
                },
                workerReports: true
            }
        }) as any)

        if (!milestone) {
            return NextResponse.json(
                { error: { message: 'Không tìm thấy milestone' } },
                { status: 404 }
            )
        }

        return getEscrowStatus(milestone)

    } catch (error) {
        console.error('Error fetching escrow status:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tải trạng thái escrow' } },
            { status: 500 }
        )
    }
}
