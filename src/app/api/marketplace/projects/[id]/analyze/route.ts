/**
 * AI Application Analysis API
 * Summarizes and compares multiple contractor applications
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST - Analyze applications for a project
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params

        // Get all applications with contractor info
        const applications = await prisma.projectApplication.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        })

        if (applications.length === 0) {
            return NextResponse.json(
                createSuccessResponse({ analysis: null }, 'Chưa có hồ sơ ứng tuyển'),
                { status: 200 }
            )
        }

        // Enrich with contractor profiles
        const enrichedApps = await Promise.all(
            applications.map(async (app) => {
                let contractor = null
                if (app.contractorId) {
                    contractor = await prisma.contractorProfile.findFirst({
                        where: { customerId: app.contractorId }
                    })
                }
                return { ...app, contractor }
            })
        )

        // Analyze applications
        const analysis = analyzeApplications(enrichedApps)

        return NextResponse.json(
            createSuccessResponse({ analysis }, 'Phân tích hồ sơ ứng tuyển'),
            { status: 200 }
        )
    } catch (error) {
        console.error('AI analysis error:', error)
        return NextResponse.json(createErrorResponse('Lỗi phân tích', 'SERVER_ERROR'), { status: 500 })
    }
}

function analyzeApplications(applications: any[]) {
    const total = applications.length
    const verified = applications.filter(a => a.contractor?.isVerified).length
    const guests = applications.filter(a => a.isGuest).length

    // Find best price
    const withBudget = applications.filter(a => a.proposedBudget && a.proposedBudget > 0)
    const sortedByPrice = [...withBudget].sort((a, b) => a.proposedBudget - b.proposedBudget)
    const bestPrice = sortedByPrice[0] || null

    // Find fastest timeline
    const withDays = applications.filter(a => a.proposedDays && a.proposedDays > 0)
    const sortedBySpeed = [...withDays].sort((a, b) => a.proposedDays - b.proposedDays)
    const fastest = sortedBySpeed[0] || null

    // Find highest trust score
    const withTrust = applications.filter(a => a.contractor?.trustScore)
    const sortedByTrust = [...withTrust].sort((a, b) => (b.contractor?.trustScore || 0) - (a.contractor?.trustScore || 0))
    const mostTrusted = sortedByTrust[0] || null

    // Find most experienced
    const withExp = applications.filter(a => a.contractor?.experienceYears)
    const sortedByExp = [...withExp].sort((a, b) => (b.contractor?.experienceYears || 0) - (a.contractor?.experienceYears || 0))
    const mostExperienced = sortedByExp[0] || null

    // Find highest rated
    const withRating = applications.filter(a => a.contractor?.avgRating)
    const sortedByRating = [...withRating].sort((a, b) => (b.contractor?.avgRating || 0) - (a.contractor?.avgRating || 0))
    const highestRated = sortedByRating[0] || null

    // Calculate averages
    const avgBudget = withBudget.length > 0
        ? withBudget.reduce((sum, a) => sum + a.proposedBudget, 0) / withBudget.length
        : 0
    const avgDays = withDays.length > 0
        ? withDays.reduce((sum, a) => sum + a.proposedDays, 0) / withDays.length
        : 0

    // Generate recommendations
    const recommendations: string[] = []

    if (verified === 0) {
        recommendations.push('⚠️ Chưa có nhà thầu Verified ứng tuyển. Cân nhắc chia sẻ rộng hơn hoặc chờ thêm.')
    } else if (verified >= 3) {
        recommendations.push('✅ Có ' + verified + ' nhà thầu Verified - Lựa chọn tốt!')
    }

    if (bestPrice && mostTrusted && bestPrice.id === mostTrusted.id) {
        recommendations.push('🌟 ' + getName(bestPrice) + ' vừa có giá tốt nhất vừa đáng tin cậy nhất!')
    } else {
        if (bestPrice) {
            recommendations.push('💰 ' + getName(bestPrice) + ' có giá thấp nhất: ' + formatCurrency(bestPrice.proposedBudget))
        }
        if (mostTrusted) {
            recommendations.push('🛡️ ' + getName(mostTrusted) + ' có điểm tin cậy cao nhất: ' + (mostTrusted.contractor?.trustScore || 0) + '%')
        }
    }

    if (fastest) {
        recommendations.push('⚡ ' + getName(fastest) + ' hoàn thành nhanh nhất: ' + fastest.proposedDays + ' ngày')
    }

    if (highestRated && highestRated.contractor?.avgRating >= 4.5) {
        recommendations.push('⭐ ' + getName(highestRated) + ' được đánh giá cao: ' + highestRated.contractor.avgRating.toFixed(1) + '/5')
    }

    if (mostExperienced && mostExperienced.contractor?.experienceYears >= 10) {
        recommendations.push('👷 ' + getName(mostExperienced) + ' có kinh nghiệm lâu năm: ' + mostExperienced.contractor.experienceYears + ' năm')
    }

    // Top 3 overall recommendation (simplified scoring)
    const scored = applications.map(app => {
        let score = 0

        // Trust score (0-30 points)
        if (app.contractor?.trustScore) {
            score += (app.contractor.trustScore / 100) * 30
        }

        // Verified bonus (20 points)
        if (app.contractor?.isVerified) {
            score += 20
        }

        // Rating (0-20 points)
        if (app.contractor?.avgRating) {
            score += (app.contractor.avgRating / 5) * 20
        }

        // Experience (0-15 points, max at 15 years)
        if (app.contractor?.experienceYears) {
            score += Math.min(app.contractor.experienceYears / 15, 1) * 15
        }

        // Has BoQ materials (5 points)
        if (app.materials && Array.isArray(app.materials) && app.materials.length > 0) {
            score += 5
        }

        // Competitive price (0-10 points)
        if (app.proposedBudget && avgBudget > 0) {
            const priceRatio = app.proposedBudget / avgBudget
            if (priceRatio <= 0.9) score += 10
            else if (priceRatio <= 1.0) score += 7
            else if (priceRatio <= 1.1) score += 5
        }

        return { ...app, score }
    }).sort((a, b) => b.score - a.score)

    const top3 = scored.slice(0, 3).map(app => ({
        id: app.id,
        name: getName(app),
        score: Math.round(app.score),
        highlights: getHighlights(app),
        isVerified: app.contractor?.isVerified || false,
        isGuest: app.isGuest,
        budget: app.proposedBudget,
        days: app.proposedDays
    }))

    return {
        summary: {
            total,
            verified,
            guests,
            avgBudget: Math.round(avgBudget),
            avgDays: Math.round(avgDays)
        },
        highlights: {
            bestPrice: bestPrice ? {
                id: bestPrice.id,
                name: getName(bestPrice),
                budget: bestPrice.proposedBudget
            } : null,
            fastest: fastest ? {
                id: fastest.id,
                name: getName(fastest),
                days: fastest.proposedDays
            } : null,
            mostTrusted: mostTrusted ? {
                id: mostTrusted.id,
                name: getName(mostTrusted),
                trustScore: mostTrusted.contractor?.trustScore
            } : null,
            highestRated: highestRated ? {
                id: highestRated.id,
                name: getName(highestRated),
                rating: highestRated.contractor?.avgRating
            } : null
        },
        recommendations,
        top3
    }
}

function getName(app: any): string {
    if (app.isGuest) return app.guestName || 'Khách'
    return app.contractor?.displayName || 'Nhà thầu'
}

function getHighlights(app: any): string[] {
    const highlights: string[] = []

    if (app.contractor?.isVerified) highlights.push('Verified')
    if (app.contractor?.trustScore >= 90) highlights.push('Rất đáng tin')
    if (app.contractor?.avgRating >= 4.5) highlights.push('Đánh giá cao')
    if (app.contractor?.experienceYears >= 10) highlights.push('Kinh nghiệm')
    if (app.materials && app.materials.length > 0) highlights.push('Có BoQ')

    return highlights
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}
