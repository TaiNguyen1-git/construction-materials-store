import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { saveNotificationForUser } from '@/lib/notification-service'
import { updateContractorTrustScore } from '@/lib/trust-score'

const verifyOtpSchema = z.object({
    otp: z.string().length(6)
})

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const quoteId = params.id
        const body = await request.json()
        const validation = verifyOtpSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(createErrorResponse('Mã OTP không hợp lệ', 'VALIDATION_ERROR'), { status: 400 })
        }

        const { otp } = validation.data

        // 1. Find quote and verify permissions
        const quote = await prisma.quoteRequest.findUnique({
            where: { id: quoteId },
            include: {
                customer: { include: { user: true } },
                contractor: { include: { user: true } }
            }
        })

        if (!quote) {
            return NextResponse.json(createErrorResponse('Yêu cầu báo giá không tồn tại', 'NOT_FOUND'), { status: 404 })
        }

        if (quote.customer.userId !== userId) {
            return NextResponse.json(createErrorResponse('Bạn không có quyền xác nhận báo giá này', 'FORBIDDEN'), { status: 403 })
        }

        // 2. Verify OTP
        if (!quote.otpCode || quote.otpCode !== otp) {
            return NextResponse.json(createErrorResponse('Mã OTP không chính xác', 'INVALID_OTP'), { status: 400 })
        }

        if (quote.otpExpiresAt && new Date() > quote.otpExpiresAt) {
            return NextResponse.json(createErrorResponse('Mã OTP đã hết hạn', 'OTP_EXPIRED'), { status: 400 })
        }

        // 3. Official Acceptance Flow (Success)
        const result = await prisma.$transaction(async (tx) => {
            // A. Update Quote Status
            const updatedQuote = await tx.quoteRequest.update({
                where: { id: quoteId },
                data: {
                    status: 'ACCEPTED',
                    isVerified: true,
                    verifiedAt: new Date(),
                    otpCode: null,
                    history: {
                        create: {
                            userId: userId,
                            oldStatus: quote.status,
                            newStatus: 'ACCEPTED',
                            notes: `Xác thực thành công qua OTP (${quote.customer.user.email}). IP: ${request.headers.get('x-forwarded-for') || (request as any).ip || 'N/A'}`
                        }
                    }
                } as any
            })

            // B. Flow 1: Update Project
            if (quote.projectId) {
                await tx.project.update({
                    where: { id: quote.projectId },
                    data: {
                        contractorId: quote.contractorId,
                        actualCost: { increment: quote.priceQuote || 0 }
                    }
                })
            }

            // Flow 5: Update Contractor Completion Count
            await (tx as any).contractorProfile.update({
                where: { customerId: quote.contractorId },
                data: { totalProjectsCompleted: { increment: 1 } }
            })

            // C. Flow 2: Create Draft Contract
            const contractNumber = `CON-${Date.now()}`
            await tx.contract.create({
                data: {
                    contractNumber,
                    customerId: quote.customerId,
                    quoteId: quote.id,
                    name: `Hợp đồng thi công #${quote.id.slice(-6).toUpperCase()}`,
                    status: 'DRAFT',
                    validFrom: new Date(),
                    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                    totalValue: quote.priceQuote || 0,
                    notes: `Được tạo tự động từ báo giá đã xác thực OTP vào lúc ${new Date().toLocaleString('vi-VN')}`
                } as any
            })

            return updatedQuote
        })

        // Flow 5: Refresh Trust Score
        await updateContractorTrustScore(quote.contractorId)

        // 4. Notifications
        try {
            await saveNotificationForUser({
                type: 'INFO' as any,
                priority: 'HIGH',
                title: 'Báo giá đã được chốt!',
                message: `Khách hàng ${quote.customer.user.name} đã xác thực và chấp nhận báo giá của bạn qua OTP. Hợp đồng nháp đã được khởi tạo.`,
                data: {
                    quoteId: quote.id,
                    status: 'ACCEPTED'
                }
            }, quote.contractor.userId)
        } catch (e) {
            console.error('Notify error:', e)
        }

        return NextResponse.json(createSuccessResponse(result, 'Xác thực và chấp nhận báo giá thành công!'))

    } catch (error: any) {
        console.error('Verify OTP error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ nội bộ', 'INTERNAL_ERROR'), { status: 500 })
    }
}
