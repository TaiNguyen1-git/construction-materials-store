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
                },
                contractorProfile: true // Include the linked profile
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
        const unpaidInvoices = await prisma.invoice.findMany({
            where: {
                customerId: customer.id,
                status: { in: ['SENT', 'OVERDUE'] }
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
        const profile = customer.contractorProfile
        const contractorProfile = {
            id: customer.id,
            userId: customer.userId,
            name: customer.user.name,
            email: customer.user.email,
            phone: profile?.phone || customer.user.phone,
            address: profile?.address || customer.user.address,
            companyName: profile?.companyName || customer.companyName,
            companyAddress: customer.companyAddress,
            taxId: customer.taxId,
            customerType: customer.customerType,
            loyaltyTier: customer.loyaltyTier,
            loyaltyPoints: customer.loyaltyPoints,
            contractorVerified: customer.contractorVerified,

            // Profile fields
            skills: profile?.skills || [],
            highlightBio: profile?.highlightBio || '',
            detailedBio: profile?.bio || '',
            yearsExperience: profile?.experienceYears || 0,
            trustScore: profile?.trustScore || 100,
            totalProjectsCompleted: profile?.totalProjectsCompleted || 0,

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


// PATCH /api/contractors/profile - Update contractor profile
export async function PATCH(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        const userId = request.headers.get('x-user-id')
        const currentUserId = payload?.userId || userId

        if (!currentUserId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const {
            companyName,
            taxId,
            phone,
            address,
            website,
            businessType,
            yearsExperience,
            skills,
            highlightBio,
            detailedBio
        } = body

        // Find customer
        const customer = await prisma.customer.findFirst({
            where: { userId: currentUserId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Customer record not found', 'NOT_FOUND'), { status: 404 })
        }

        // Update customer fields
        const updatedCustomer = await prisma.customer.update({
            where: { id: customer.id },
            data: {
                companyName,
                taxId,
                companyAddress: address, // Map address to companyAddress
                customerType: businessType === 'company' ? 'CONTRACTOR' : 'CONTRACTOR' // Ensure it's contractor
            }
        })

        // Upsert contractor profile
        const contractorProfile = await prisma.contractorProfile.upsert({
            where: { customerId: customer.id },
            update: {
                displayName: companyName || updatedCustomer.companyName || 'Nhà thầu',
                bio: detailedBio,
                highlightBio: highlightBio,
                phone: phone,
                website: website,
                experienceYears: yearsExperience,
                skills: skills || [],
                companyName: companyName,
                address: address
            },
            create: {
                customerId: customer.id,
                displayName: companyName || 'Nhà thầu',
                bio: detailedBio,
                highlightBio: highlightBio,
                phone: phone,
                website: website,
                experienceYears: yearsExperience,
                skills: skills || [],
                companyName: companyName,
                address: address
            }
        })

        return NextResponse.json(
            createSuccessResponse(contractorProfile, 'Cập nhật hồ sơ thành công'),
            { status: 200 }
        )

    } catch (error) {
        console.error('Error updating contractor profile:', error)
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
