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

        // Enhance profiles with more stats
        const contractorsWithStats = await Promise.all(
            profiles.map(async (profile) => {
                // Count active projects
                const activeProjects = await prisma.quoteRequest.count({
                    where: {
                        contractorId: profile.customerId,
                        status: 'ACCEPTED'
                    }
                })

                // Calculate total earnings (released milestones)
                const quotes = await (prisma.quoteRequest.findMany({
                    where: {
                        contractorId: profile.customerId,
                        status: 'ACCEPTED'
                    },
                    include: {
                        milestones: {
                            where: { status: 'RELEASED' }
                        }
                    }
                }) as any)

                const totalEarnings = quotes.reduce((sum: number, q: any) => {
                    return sum + (q.milestones?.reduce((mSum: number, m: any) => mSum + m.amount, 0) || 0)
                }, 0)

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
        )

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
