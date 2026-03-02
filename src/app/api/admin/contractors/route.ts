/**
 * API: List all contractors with stats for Admin
 * GET /api/admin/contractors
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const skill = searchParams.get('skill')

        // Find all contractor profiles
        const profiles = await prisma.contractorProfile.findMany({
            where: {
                ...(city && { city }),
                ...(skill && { skills: { has: skill } })
            },
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                phone: true,
                                isActive: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                trustScore: 'desc'
            }
        })

        // Fetch all relevant quotes for these contractors at once (Fix N+1 query)
        const contractorIds = profiles.map(p => p.customerId).filter(Boolean) as string[]
        const allQuotes = await prisma.quoteRequest.findMany({
            where: {
                contractorId: { in: contractorIds },
                status: 'ACCEPTED'
            },
            include: {
                milestones: {
                    where: { status: 'RELEASED' }
                }
            }
        })

        // Precompute stats per contractor
        const activeProjectsMap = new Map<string, number>()
        const earningsMap = new Map<string, number>()

        for (const quote of allQuotes) {
            if (!quote.contractorId) continue

            // Count active projects
            const curCount = activeProjectsMap.get(quote.contractorId) || 0
            activeProjectsMap.set(quote.contractorId, curCount + 1)

            // Calculate earnings
            const curEarnings = earningsMap.get(quote.contractorId) || 0
            const quoteEarnings = (quote as any).milestones?.reduce((sum: number, m: any) => sum + m.amount, 0) || 0
            earningsMap.set(quote.contractorId, curEarnings + quoteEarnings)
        }

        // Enhance profiles with more stats
        const contractorsWithStats = profiles.map((profile) => {
            const activeProjects = activeProjectsMap.get(profile.customerId) || 0
            const totalEarnings = earningsMap.get(profile.customerId) || 0

            return {
                id: profile.id,
                name: profile.displayName || profile.customer.user.name,
                email: profile.email || profile.customer.user.email,
                phone: profile.phone || profile.customer.user.phone,
                companyName: profile.companyName,
                city: profile.city,
                avgRating: profile.avgRating,
                reviewCount: profile.reviewCount,
                trustScore: profile.trustScore,
                onboardingStatus: profile.onboardingStatus,
                isVerified: profile.isVerified,
                isActive: profile.customer.user.isActive,
                stats: {
                    activeProjects,
                    completedProjects: profile.totalProjectsCompleted,
                    totalEarnings
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: contractorsWithStats
        })

    } catch (error) {
        console.error('Error fetching contractors list:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tải danh sách nhà thầu' } },
            { status: 500 }
        )
    }
}
