import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET: Chi tiết khách hàng + lịch sử giao dịch điểm
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                user: {
                    select: { name: true, email: true, phone: true, createdAt: true }
                },
                loyaltyVouchers: {
                    orderBy: { redeemedAt: 'desc' },
                    take: 20,
                },
                loyaltyTransactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
                orders: {
                    select: {
                        id: true,
                        orderNumber: true,
                        totalAmount: true,
                        status: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                }
            }
        })

        if (!customer) {
            return NextResponse.json(
                createErrorResponse('Không tìm thấy khách hàng', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({
                id: customer.id,
                name: customer.user.name,
                email: customer.user.email,
                phone: customer.user.phone,
                customerType: customer.customerType,
                tier: customer.loyaltyTier,
                points: customer.loyaltyPoints,
                totalPointsEarned: customer.totalPointsEarned,
                totalPointsRedeemed: customer.totalPointsRedeemed,
                totalPurchases: customer.totalPurchases,
                lastPurchaseDate: customer.lastPurchaseDate,
                birthday: customer.birthday,
                referralCode: customer.referralCode,
                totalReferrals: customer.totalReferrals,
                companyName: customer.companyName,
                contractorVerified: customer.contractorVerified,
                memberSince: customer.user.createdAt,
                vouchers: customer.loyaltyVouchers,
                transactions: customer.loyaltyTransactions,
                recentOrders: customer.orders,
            }, 'Lấy thông tin khách hàng thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching customer detail:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
