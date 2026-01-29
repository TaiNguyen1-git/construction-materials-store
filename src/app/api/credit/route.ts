/**
 * Credit Management API - SME Feature 1
 * 
 * Endpoints:
 * - POST /api/credit/check - Kiểm tra tín dụng
 * - GET /api/credit/customer/[id] - Lấy thông tin công nợ
 * - POST /api/credit/approval - Tạo yêu cầu duyệt
 * - PUT /api/credit/approval/[id] - Duyệt/Từ chối
 * - GET /api/credit/report/aging - Báo cáo tuổi nợ
 */

/**
 * Credit API Route - SME Feature 1
 */
import { NextRequest, NextResponse } from 'next/server'
import { creditCheckService } from '@/lib/credit-check-service'
import { prisma } from '@/lib/prisma'

// POST /api/credit - Kiểm tra tín dụng hoặc tạo yêu cầu duyệt
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, customerId, orderAmount, orderId, reason } = body

        if (action === 'check') {
            // Kiểm tra tín dụng
            if (!customerId || orderAmount === undefined) {
                return NextResponse.json(
                    { error: 'Thiếu customerId hoặc orderAmount' },
                    { status: 400 }
                )
            }

            const result = await creditCheckService.checkCreditEligibility(
                customerId,
                orderAmount
            )

            return NextResponse.json(result)
        }

        if (action === 'request-approval') {
            // Tạo yêu cầu duyệt ngoại lệ
            if (!customerId || !orderAmount || !reason) {
                return NextResponse.json(
                    { error: 'Thiếu thông tin yêu cầu duyệt' },
                    { status: 400 }
                )
            }

            const approval = await creditCheckService.createCreditApprovalRequest(
                customerId,
                orderId || null,
                orderAmount,
                reason
            )

            return NextResponse.json(approval)
        }

        return NextResponse.json(
            { error: 'Action không hợp lệ. Sử dụng: check, request-approval' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Credit API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}

// GET /api/credit - Lấy danh sách pending approvals hoặc debt aging report
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')

        if (type === 'aging-report') {
            // Báo cáo tuổi nợ
            const report = await creditCheckService.generateDebtAgingReport()
            return NextResponse.json(report)
        }

        if (type === 'pending-approvals') {
            // Danh sách chờ duyệt
            const approvals = await prisma.creditApproval.findMany({
                where: { status: 'PENDING' },
                include: {
                    customer: {
                        include: { user: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            return NextResponse.json(approvals)
        }

        if (type === 'configurations') {
            // Lấy cấu hình công nợ
            const configs = await prisma.debtConfiguration.findMany({
                orderBy: { name: 'asc' }
            })
            return NextResponse.json(configs)
        }

        return NextResponse.json(
            { error: 'Type không hợp lệ. Sử dụng: aging-report, pending-approvals, configurations' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Credit GET API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}

// PUT /api/credit - Duyệt/Từ chối approval hoặc cập nhật configuration
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, approvalId, approved, approvedBy, rejectedReason, configData } = body

        if (action === 'process-approval') {
            if (!approvalId || approved === undefined || !approvedBy) {
                return NextResponse.json(
                    { error: 'Thiếu thông tin xử lý' },
                    { status: 400 }
                )
            }

            const result = await creditCheckService.processApproval(
                approvalId,
                approved,
                approvedBy,
                rejectedReason
            )

            return NextResponse.json(result)
        }

        if (action === 'update-config') {
            if (!configData) {
                return NextResponse.json(
                    { error: 'Thiếu dữ liệu cấu hình' },
                    { status: 400 }
                )
            }

            const { id, createdAt, updatedAt, ...cleanData } = configData

            const config = await prisma.debtConfiguration.upsert({
                where: { name: cleanData.name },
                create: cleanData,
                update: cleanData
            })

            return NextResponse.json(config)
        }

        if (action === 'update-customer-credit') {
            const { customerId, creditLimit, creditHold, maxOverdueDays } = body
            if (!customerId) {
                return NextResponse.json({ error: 'Thiếu customerId' }, { status: 400 })
            }

            const updated = await prisma.customer.update({
                where: { id: customerId },
                data: {
                    creditLimit: creditLimit !== undefined ? parseFloat(creditLimit) : undefined,
                    creditHold: creditHold !== undefined ? creditHold : undefined,
                    maxOverdueDays: maxOverdueDays !== undefined ? parseInt(maxOverdueDays) : undefined
                } as any
            })

            return NextResponse.json(updated)
        }

        if (action === 'soft-delete-customer') {
            const { customerId } = body
            if (!customerId) return NextResponse.json({ error: 'Thiếu customerId' }, { status: 400 })

            const deleted = await prisma.customer.update({
                where: { id: customerId },
                data: { isDeleted: true } as any
            })
            return NextResponse.json(deleted)
        }

        return NextResponse.json(
            { error: 'Action không hợp lệ' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Credit PUT API error:', error)
        return NextResponse.json(
            { error: 'Lỗi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}
