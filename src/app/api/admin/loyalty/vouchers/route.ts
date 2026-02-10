import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET: Danh sách voucher (admin view)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || undefined
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where: any = {}
        if (status) where.status = status

        const [vouchers, total] = await Promise.all([
            prisma.loyaltyVoucher.findMany({
                where,
                include: {
                    customer: {
                        include: {
                            user: {
                                select: { name: true, email: true }
                            }
                        }
                    }
                },
                orderBy: { redeemedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.loyaltyVoucher.count({ where }),
        ])

        const formatted = vouchers.map(v => ({
            id: v.id,
            code: v.code,
            value: v.value,
            pointsUsed: v.pointsUsed,
            status: v.status,
            customerName: v.customer?.user?.name || 'N/A',
            customerEmail: v.customer?.user?.email || 'N/A',
            redeemedAt: v.redeemedAt,
            usedAt: v.usedAt,
            expiryDate: v.expiryDate,
        }))

        return NextResponse.json(
            createSuccessResponse({
                vouchers: formatted,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                }
            }, 'Lấy danh sách voucher thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching admin vouchers:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
