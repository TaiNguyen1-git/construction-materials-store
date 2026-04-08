/**
 * API: Contractor Wallet Withdrawal
 * POST /api/contractors/wallet/withdraw
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { z } from 'zod'
import { RestrictionService } from '@/lib/restriction-service'
import { AnomalyDetectionService } from '@/lib/anomaly-detection-service'
import { AuditService } from '@/lib/audit-service'
import { WalletService } from '@/lib/wallet-service'

const withdrawSchema = z.object({
    amount: z.number().min(50000, 'Số tiền rút tối thiểu là 50.000đ'),
    bankName: z.string().min(1, 'Vui lòng nhập tên ngân hàng'),
    accountNumber: z.string().min(1, 'Vui lòng nhập số tài khoản'),
    accountHolder: z.string().min(1, 'Vui lòng nhập tên chủ tài khoản'),
    idempotencyKey: z.string().optional()
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

        const { amount, bankName, accountNumber, accountHolder, idempotencyKey } = validation.data

        // Find customer
        const customer = await prisma.customer.findFirst({
            where: { userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Không tìm thấy tài khoản', 'NOT_FOUND'), { status: 404 })
        }

        // 1. IDEMPOTENCY CHECK
        if (idempotencyKey) {
            const isFresh = await WalletService.checkIdempotency(idempotencyKey, 'withdraw')
            if (!isFresh) {
                return NextResponse.json(createErrorResponse('Yêu cầu đang được xử lý hoặc đã hoàn tất', 'DUPLICATE_REQUEST'), { status: 409 })
            }
        }

        // 2. INTEGRITY CHECK: WALLET_HOLD
        const canWithdraw = await RestrictionService.canWithdraw(customer.id)
        if (!canWithdraw.allowed) {
            return NextResponse.json(
                createErrorResponse(
                    `Tài khoản của bạn đang bị hạn chế rút tiền. Lý do: ${canWithdraw.restriction?.reason || 'Đang điều tra'}`,
                    'RESTRICTED'
                ),
                { status: 403 }
            )
        }

        // 3. ATOMIC BALANCE CHECK & UPDATE
        const wallet = await prisma.wallet.findUnique({
            where: { customerId: customer.id }
        })

        if (!wallet) return NextResponse.json(createErrorResponse('Ví chưa được khởi tạo', 'NOT_FOUND'), { status: 404 })

        const isRapidWithdrawal = await AnomalyDetectionService.detectRapidWithdrawals(customer.id)

        const result = await prisma.$transaction(async (tx) => {
            // Atomic decrement with condition
            const updateResult = await tx.wallet.updateMany({
                where: { 
                    id: wallet.id,
                    balance: { gte: amount }
                },
                data: {
                    balance: { decrement: amount },
                    holdBalance: { increment: amount }
                }
            })

            if (updateResult.count === 0) {
                throw new Error('Số dư không đủ')
            }

            const transaction = await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount: -amount,
                    type: 'WITHDRAWAL',
                    status: 'PENDING',
                    description: `Rút tiền về ${bankName} - ${accountNumber} - ${accountHolder}`,
                    metadata: {
                        bankName,
                        accountNumber,
                        accountHolder,
                        idempotencyKey,
                        requestedAt: new Date().toISOString()
                    }
                }
            })

            return transaction
        })

        // 4. Audit & Return
        await AuditService.logFinancial(
            AuditService.extractContext(request, { id: userId }),
            'WALLET_WITHDRAWAL',
            'Wallet',
            wallet.id,
            { oldValue: { balance: wallet.balance }, newValue: { balance: wallet.balance - amount }, amount }
        )

        return NextResponse.json(createSuccessResponse({ transactionId: result.id, status: 'PENDING' }), { status: 201 })

    } catch (error: any) {
        console.error('Wallet withdrawal error:', error)
        return NextResponse.json(createErrorResponse(error.message || 'Lỗi xử lý', 'INTERNAL_ERROR'), { status: 500 })
    }
}
