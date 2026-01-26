/**
 * API: Contractor Wallet Withdrawal
 * POST /api/contractors/wallet/withdraw
 * 
 * Tạo yêu cầu rút tiền từ ví nhà thầu về ngân hàng
 * 
 * INTEGRITY SUITE INTEGRATION:
 * - Check WALLET_HOLD restriction
 * - Detect rapid withdrawals
 * - Audit log all withdrawals
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { RestrictionService } from '@/lib/restriction-service'
import { AnomalyDetectionService } from '@/lib/anomaly-detection-service'
import { AuditService } from '@/lib/audit-service'

const withdrawSchema = z.object({
    amount: z.number().min(50000, 'Số tiền rút tối thiểu là 50.000đ'),
    bankName: z.string().min(1, 'Vui lòng nhập tên ngân hàng'),
    accountNumber: z.string().min(1, 'Vui lòng nhập số tài khoản'),
    accountHolder: z.string().min(1, 'Vui lòng nhập tên chủ tài khoản')
})

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const validation = withdrawSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                createErrorResponse('Dữ liệu không hợp lệ', 'VALIDATION_ERROR', validation.error.issues),
                { status: 400 }
            )
        }

        const { amount, bankName, accountNumber, accountHolder } = validation.data

        // Find customer
        const customer = await prisma.customer.findFirst({
            where: { userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Không tìm thấy tài khoản', 'NOT_FOUND'), { status: 404 })
        }

        // ========== INTEGRITY CHECK: WALLET_HOLD ==========
        const canWithdraw = await RestrictionService.canWithdraw(customer.id)
        if (!canWithdraw.allowed) {
            // Log attempted restricted action
            await AuditService.log(
                AuditService.extractContext(request, { id: userId }),
                {
                    action: 'WALLET_WITHDRAWAL',
                    entityType: 'Wallet',
                    entityId: customer.id,
                    metadata: {
                        attemptedAmount: amount,
                        blocked: true,
                        restrictionType: canWithdraw.restriction?.type
                    },
                    severity: 'WARNING'
                }
            )

            return NextResponse.json(
                createErrorResponse(
                    `Tài khoản của bạn đang bị hạn chế rút tiền. Lý do: ${canWithdraw.restriction?.reason || 'Đang điều tra'}`,
                    'RESTRICTED'
                ),
                { status: 403 }
            )
        }

        // Check wallet balance
        const wallet = await prisma.wallet.findUnique({
            where: { customerId: customer.id }
        })

        if (!wallet) {
            return NextResponse.json(createErrorResponse('Ví chưa được khởi tạo', 'NOT_FOUND'), { status: 404 })
        }

        if (wallet.balance < amount) {
            return NextResponse.json(
                createErrorResponse(`Số dư không đủ. Số dư hiện tại: ${wallet.balance.toLocaleString('vi-VN')}đ`, 'INSUFFICIENT_BALANCE'),
                { status: 400 }
            )
        }

        // ========== ANOMALY DETECTION: Rapid Withdrawals ==========
        const isRapidWithdrawal = await AnomalyDetectionService.detectRapidWithdrawals(customer.id)
        // Note: We still allow the withdrawal but flag it for review

        // Create withdrawal transaction (deduct from balance, add to hold)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update wallet: decrease balance, increase hold
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: amount },
                    holdBalance: { increment: amount }
                }
            })

            // 2. Create withdrawal transaction record
            const transaction = await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount: -amount, // Negative for withdrawal
                    type: 'WITHDRAWAL',
                    status: 'PENDING',
                    description: `Rút tiền về ${bankName} - ${accountNumber} - ${accountHolder}`,
                    metadata: {
                        bankName,
                        accountNumber,
                        accountHolder,
                        requestedAt: new Date().toISOString(),
                        flaggedForReview: isRapidWithdrawal
                    }
                }
            })

            // 3. Create notification for admin
            await tx.notification.create({
                data: {
                    type: 'PAYMENT_UPDATE',
                    title: isRapidWithdrawal
                        ? '⚠️ Yêu cầu rút tiền BẤT THƯỜNG'
                        : '💸 Yêu cầu rút tiền mới',
                    message: `Nhà thầu yêu cầu rút ${amount.toLocaleString('vi-VN')}đ về ${bankName}${isRapidWithdrawal ? ' [FLAGGED]' : ''}`,
                    priority: isRapidWithdrawal ? 'HIGH' : 'MEDIUM',
                    referenceId: transaction.id,
                    referenceType: 'WALLET_WITHDRAWAL'
                }
            })

            return transaction
        })

        // ========== AUDIT LOG ==========
        await AuditService.logFinancial(
            AuditService.extractContext(request, { id: userId }),
            'WALLET_WITHDRAWAL',
            'Wallet',
            wallet.id,
            {
                oldValue: { balance: wallet.balance },
                newValue: { balance: wallet.balance - amount },
                amount,
                reason: `Rút về ${bankName} - ${accountNumber}`
            }
        )

        return NextResponse.json(
            createSuccessResponse({
                transactionId: result.id,
                amount,
                status: 'PENDING',
                message: 'Yêu cầu rút tiền đã được gửi. Chúng tôi sẽ xử lý trong vòng 24 giờ.'
            }, 'Yêu cầu rút tiền đã được ghi nhận'),
            { status: 201 }
        )

    } catch (error: any) {
        console.error('Wallet withdrawal error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi xử lý yêu cầu rút tiền', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

