import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST /api/admin/payments/approve
export async function POST(request: NextRequest) {
    try {
        const { paymentId, supplierId } = await request.json()

        if (!paymentId || !supplierId) {
            return NextResponse.json(createErrorResponse('Missing paymentId or supplierId', 'VALIDATION_ERROR'), { status: 400 })
        }

        // 1. Get the Payment
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        })

        if (!payment) {
            return NextResponse.json(createErrorResponse('Payment not found', 'NOT_FOUND'), { status: 404 })
        }

        if (payment.status === 'PAID') {
            return NextResponse.json(createErrorResponse('Payment already approved', 'CONFLICT'), { status: 409 })
        }

        // 2. Execute Transaction Logic (Deduct Balance)
        // Use transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            // Update Payment Status
            await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'PAID',
                    updatedAt: new Date()
                }
            })

            // Deduct Supplier Balance
            await tx.supplier.update({
                where: { id: supplierId },
                data: {
                    currentBalance: {
                        decrement: payment.amount
                    }
                }
            })

            // Auto-reconcile "RECEIVED" Purchase Orders (FIFO or just all?)
            // For this flow, we assume clearing the balance means clearing related debts.
            // We'll mark them as CONFIRMED.
            await (tx.purchaseOrder as any).updateMany({
                where: {
                    supplierId,
                    status: 'RECEIVED'
                },
                data: {
                    status: 'CONFIRMED'
                }
            })
        })

        // 3. Notify (Simulated)
        console.log(`[Admin] Approved Withdrawal ${paymentId} for Supplier ${supplierId}`)

        return NextResponse.json(createSuccessResponse(null, 'Đã phê duyệt yêu cầu rút tiền thành công.'))

    } catch (error: any) {
        console.error('Admin Approve Error:', error)
        return NextResponse.json(createErrorResponse('Failed to approve payment', 'SERVER_ERROR'), { status: 500 })
    }
}
