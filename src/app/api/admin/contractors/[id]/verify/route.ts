/**
 * API: Admin Verify Contractor
 * POST - Approve or reject contractor verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { saveNotificationForUser } from '@/lib/notification-service'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/admin/contractors/[id]/verify - Admin approves or rejects contractor
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = request.headers.get('x-user-id')
        const userRole = request.headers.get('x-user-role')

        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        // Check admin permission
        if (userRole !== 'MANAGER') {
            return NextResponse.json(createErrorResponse('Chỉ quản trị viên mới có quyền duyệt hồ sơ', 'FORBIDDEN'), { status: 403 })
        }

        const { id: customerId } = await params
        const body = await request.json()
        const { action, rejectReason, trustScoreBonus } = body

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(createErrorResponse('Action phải là approve hoặc reject', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Find customer
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { user: true }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Không tìm thấy khách hàng', 'NOT_FOUND'), { status: 404 })
        }

        // Find contractor profile
        const profile = await prisma.contractorProfile.findUnique({
            where: { customerId }
        })

        if (!profile) {
            return NextResponse.json(createErrorResponse('Không tìm thấy hồ sơ nhà thầu', 'NOT_FOUND'), { status: 404 })
        }

        if (action === 'approve') {
            // Update customer verification status
            await prisma.customer.update({
                where: { id: customerId },
                data: { contractorVerified: true }
            })

            // Update contractor profile
            const newTrustScore = Math.min(100, profile.trustScore + (trustScoreBonus || 20))
            await prisma.contractorProfile.update({
                where: { id: profile.id },
                data: {
                    isVerified: true,
                    trustScore: newTrustScore
                }
            })

            // Notify contractor about approval
            try {
                await saveNotificationForUser({
                    type: 'ORDER_UPDATE' as any,
                    priority: 'HIGH',
                    title: '✅ Hồ sơ đã được duyệt!',
                    message: `Chúc mừng! Hồ sơ nhà thầu của bạn đã được phê duyệt. Bạn đã nhận được huy hiệu "Đã xác minh" và điểm tín nhiệm +${trustScoreBonus || 20}.`,
                    data: {
                        verified: true,
                        trustScoreBonus: trustScoreBonus || 20
                    }
                }, customer.userId, 'CUSTOMER')
            } catch (e) {
                console.error('Failed to send notification:', e)
            }

            return NextResponse.json(createSuccessResponse({
                customerId,
                verified: true,
                trustScore: newTrustScore
            }, 'Đã duyệt hồ sơ nhà thầu'))

        } else {
            // Reject
            await prisma.contractorProfile.update({
                where: { id: profile.id },
                data: { isVerified: false }
            })

            // Notify contractor about rejection
            try {
                await saveNotificationForUser({
                    type: 'ORDER_UPDATE' as any,
                    priority: 'MEDIUM',
                    title: '❌ Hồ sơ bị từ chối',
                    message: `Hồ sơ nhà thầu của bạn chưa được phê duyệt. Lý do: ${rejectReason || 'Thông tin không đầy đủ hoặc không hợp lệ'}. Vui lòng cập nhật và gửi lại.`,
                    data: {
                        verified: false,
                        rejectReason: rejectReason || 'Thông tin không đầy đủ hoặc không hợp lệ'
                    }
                }, customer.userId, 'CUSTOMER')
            } catch (e) {
                console.error('Failed to send notification:', e)
            }

            return NextResponse.json(createSuccessResponse({
                customerId,
                verified: false,
                rejectReason
            }, 'Đã từ chối hồ sơ nhà thầu'))
        }

    } catch (error: any) {
        console.error('Verify contractor error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ nội bộ', 'INTERNAL_ERROR'), { status: 500 })
    }
}

// GET /api/admin/contractors/[id]/verify - Get verification details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const userId = request.headers.get('x-user-id')
        const userRole = request.headers.get('x-user-role')

        if (!userId || userRole !== 'MANAGER') {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const { id: customerId } = await params

        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: { user: true }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Không tìm thấy khách hàng', 'NOT_FOUND'), { status: 404 })
        }

        const profile = await prisma.contractorProfile.findUnique({
            where: { customerId }
        })

        return NextResponse.json(createSuccessResponse({
            customer: {
                id: customer.id,
                name: customer.user.name,
                email: customer.user.email,
                phone: customer.user.phone,
                companyName: customer.companyName,
                taxId: customer.taxId,
                companyAddress: customer.companyAddress,
                contractorVerified: customer.contractorVerified
            },
            profile
        }))

    } catch (error: any) {
        console.error('Get contractor details error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ nội bộ', 'INTERNAL_ERROR'), { status: 500 })
    }
}
