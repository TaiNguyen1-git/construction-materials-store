import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export const dynamic = 'force-dynamic'

// GET: Fetch Payments & Balance
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')

        if (!supplierId) {
            return NextResponse.json(createErrorResponse('Missing supplierId', 'VALIDATION_ERROR'), { status: 400 })
        }

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            select: {
                currentBalance: true,
                creditLimit: true,
                paymentTerms: true,
                name: true,
                bankName: true,
                bankAccountNumber: true,
                bankAccountName: true
            }
        })

        if (!supplier) {
            return NextResponse.json(createErrorResponse('Supplier not found', 'NOT_FOUND'), { status: 404 })
        }

        // Get recent payments/transactions
        const unpaidOrders = await (prisma.purchaseOrder as any).findMany({
            where: {
                supplierId,
                status: 'RECEIVED'
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
        })

        // Fetch actual payments (Including PENDING outgoing requests)
        const recentPayments = await prisma.payment.findMany({
            where: {
                invoice: {
                    supplierId
                }
            },
            include: {
                invoice: {
                    select: { invoiceNumber: true }
                }
            },
            orderBy: { paymentDate: 'desc' },
            take: 10
        })

        // Also fetch direct withdrawals (not linked to invoice)
        const withdrawals = await prisma.payment.findMany({
            where: {
                notes: { contains: supplierId }
            },
            orderBy: { paymentDate: 'desc' },
            take: 5
        })

        // Merge lists and dedup
        const allPayments = [...recentPayments, ...withdrawals]
            .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i)
            .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
            .slice(0, 20)


        return NextResponse.json(createSuccessResponse({
            summary: supplier,
            unpaidTransactions: unpaidOrders,
            paymentHistory: allPayments
        }))
    } catch (error) {
        console.error('Fetch payments error:', error)
        return NextResponse.json(createErrorResponse('Failed to fetch payments', 'SERVER_ERROR'), { status: 500 })
    }
}

// POST /api/supplier/payments - Request Withdrawal (Create PENDING Payment)
export async function POST(request: NextRequest) {
    try {
        const { supplierId, amount } = await request.json()

        if (!supplierId || !amount) {
            return NextResponse.json(createErrorResponse('Missing data', 'VALIDATION_ERROR'), { status: 400 })
        }

        // 1. Get Supplier Bank Info for Snapshot
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId }
        })

        if (!supplier) {
            return NextResponse.json(createErrorResponse('Supplier not found', 'NOT_FOUND'), { status: 404 })
        }

        // 2. Create a Payment Request with Snapshot
        const payment = await prisma.payment.create({
            data: {
                amount,
                paymentDate: new Date(),
                paymentMethod: 'BANK_TRANSFER',
                paymentType: 'OUTGOING', // Chi tiền ra cho NCC
                status: 'PENDING',       // Chờ duyệt
                currency: 'VND',
                paymentNumber: `REQ-${Date.now()}`,
                notes: `Yêu cầu rút tiền từ NCC: ${supplierId}`,
                beneficiaryInfo: {
                    bankName: supplier.bankName,
                    bankAccount: supplier.bankAccountNumber,
                    accountName: supplier.bankAccountName,
                    supplierName: supplier.name
                }
            }
        })

        return NextResponse.json(createSuccessResponse(payment, 'Yêu cầu rút tiền đã được gửi. Vui lòng chờ duyệt.'))
    } catch (error: any) {
        console.error('Payment Request error:', error)
        return NextResponse.json(createErrorResponse(error.message || 'Failed to request payment', 'SERVER_ERROR'), { status: 500 })
    }
}
