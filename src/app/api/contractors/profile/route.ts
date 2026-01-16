import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// GET /api/contractors/profile - Get contractor profile with credit info
export async function GET(request: NextRequest) {
    try {
        // Get user from auth header or token
        const authHeader = request.headers.get('authorization')
        const userId = request.headers.get('x-user-id')

        let currentUserId = userId

        // Try to get from JWT if available
        const tokenPayload = verifyTokenFromRequest(request)
        if (tokenPayload?.userId) {
            currentUserId = tokenPayload.userId
        }

        if (!currentUserId) {
            return NextResponse.json(
                createErrorResponse('Unauthorized', 'UNAUTHORIZED'),
                { status: 401 }
            )
        }

        // Get customer record for this user
        const customer = await prisma.customer.findFirst({
            where: { userId: currentUserId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        address: true
                    }
                }
            }
        })

        if (!customer) {
            return NextResponse.json(
                createErrorResponse('Customer not found', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Check if customer is a contractor
        if (customer.customerType !== 'CONTRACTOR' && !customer.contractorVerified) {
            return NextResponse.json(
                createErrorResponse('Not a contractor account', 'FORBIDDEN'),
                { status: 403 }
            )
        }

        // Calculate current debt from unpaid invoices
        // InvoiceStatus enum: DRAFT, SENT, PAID, OVERDUE, CANCELLED
        const unpaidInvoices = await prisma.invoice.findMany({
            where: {
                customerId: customer.id,
                status: { in: ['SENT', 'OVERDUE'] } // Only valid InvoiceStatus values
            },
            select: {
                id: true,
                invoiceNumber: true,
                totalAmount: true,
                paidAmount: true,
                balanceAmount: true,
                issueDate: true,
                dueDate: true,
                status: true
            },
            orderBy: { dueDate: 'asc' }
        })

        // Calculate totals
        const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0)
        const overdueInvoices = unpaidInvoices.filter(inv => {
            if (!inv.dueDate) return false
            return new Date(inv.dueDate) < new Date()
        })
        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0)

        // Calculate due this week
        const now = new Date()
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const dueThisWeekInvoices = unpaidInvoices.filter(inv => {
            if (!inv.dueDate) return false
            const dueDate = new Date(inv.dueDate)
            return dueDate >= now && dueDate <= oneWeekFromNow
        })
        const dueThisWeek = dueThisWeekInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0)

        // Get discount percent based on loyalty tier
        const discountPercent = getDiscountByTier(customer.loyaltyTier)

        // Build response
        const contractorProfile = {
            id: customer.id,
            userId: customer.userId,
            name: customer.user.name,
            email: customer.user.email,
            phone: customer.user.phone,
            address: customer.user.address,
            companyName: customer.companyName,
            companyAddress: customer.companyAddress,
            taxId: customer.taxId,
            customerType: customer.customerType,
            loyaltyTier: customer.loyaltyTier,
            loyaltyPoints: customer.loyaltyPoints,
            contractorVerified: customer.contractorVerified,

            // Credit Info
            creditLimit: customer.creditLimit,
            currentBalance: customer.currentBalance,
            creditHold: customer.creditHold,
            availableCredit: customer.creditLimit - totalDebt,

            // Debt Summary
            debtSummary: {
                totalDebt,
                overdueAmount,
                dueThisWeek,
                creditLimit: customer.creditLimit,
                creditUsagePercent: customer.creditLimit > 0
                    ? Math.round((totalDebt / customer.creditLimit) * 100)
                    : 0
            },

            // Discount
            discountPercent,

            // Invoices
            unpaidInvoices: unpaidInvoices.map(inv => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                amount: inv.totalAmount,
                paid: inv.paidAmount,
                balance: inv.balanceAmount,
                date: inv.issueDate,
                dueDate: inv.dueDate,
                status: mapInvoiceStatus(inv.status, inv.dueDate)
            }))
        }

        return NextResponse.json(
            createSuccessResponse(contractorProfile, 'Contractor profile retrieved successfully'),
            { status: 200 }
        )

    } catch (error) {
        console.error('Error fetching contractor profile:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

function getDiscountByTier(tier: string): number {
    switch (tier) {
        case 'DIAMOND': return 20
        case 'PLATINUM': return 15
        case 'GOLD': return 12
        case 'SILVER': return 8
        case 'BRONZE': return 5
        default: return 0
    }
}

function mapInvoiceStatus(status: string, dueDate: Date | null): 'PAID' | 'PENDING' | 'OVERDUE' {
    if (status === 'PAID') return 'PAID'
    if (dueDate && new Date(dueDate) < new Date()) return 'OVERDUE'
    return 'PENDING'
}
