import { prisma } from './prisma'

/**
 * Trust Score Calculation Logic (Flow 5)
 * 
 * Formula Components:
 * - Base: 50 points
 * - Average Rating: AvgRating * 8 (max 40 points)
 * - KYC Verified: +15 points
 * - Projects Completed: completedCount * 1.5 (max 30 points)
 * - Price Accuracy Penalty: (5 - avgPriceAccuracy) * 5
 * - Material Quality Bonus: (avgMaterialQuality - 3) * 2
 * 
 * Range: 10 - 100
 */

interface BasicReview {
    rating: number;
    priceAccuracy?: number;
    materialQuality?: number;
}

export async function updateContractorTrustScore(contractorId: string) {
    try {
        const profile = await prisma.contractorProfile.findUnique({
            where: { id: contractorId },
            include: {
                reviews: true
            }
        })

        if (!profile) return

        // Get customer verification status
        const customer = await prisma.customer.findUnique({
            where: { id: profile.customerId },
            select: { contractorVerified: true }
        })

        const reviews = profile.reviews as unknown as BasicReview[]
        const reviewCount = reviews.length

        // Base score
        let score = 50

        // KYC Verification Bonus (+15)
        if (customer?.contractorVerified || profile.isVerified) {
            score += 15
        }

        // If no reviews, use default + verification bonus only
        if (reviewCount === 0) {
            score = Math.min(100, Math.max(10, score))
            await prisma.contractorProfile.update({
                where: { id: contractorId },
                data: {
                    trustScore: Math.round(score * 10) / 10,
                    reviewCount: 0
                }
            })
            return
        }

        // Calculate averages from reviews
        const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
        const avgPriceAccuracy = reviews.reduce((s, r) => s + (r.priceAccuracy || 5), 0) / reviewCount
        const avgMaterialQuality = reviews.reduce((s, r) => s + (r.materialQuality || 5), 0) / reviewCount

        // Rating bonus (max 40 points for 5 stars)
        score += avgRating * 8

        // Penalty for price inaccuracy (if below 4 stars)
        const pricePenalty = avgPriceAccuracy < 4 ? (5 - avgPriceAccuracy) * 5 : 0
        score -= pricePenalty

        // Material quality bonus
        const materialBonus = (avgMaterialQuality - 3) * 2
        score += materialBonus

        // Projects completed bonus (max 30 points for 20+ projects)
        const completedCount = profile.totalProjectsCompleted || 0
        score += Math.min(30, completedCount * 1.5)

        // Clamp 10-100
        score = Math.min(100, Math.max(10, score))

        await prisma.contractorProfile.update({
            where: { id: contractorId },
            data: {
                trustScore: Math.round(score * 10) / 10,
                avgRating: Math.round(avgRating * 10) / 10,
                reviewCount
            }
        })

    } catch (error) {
        console.error('Failed to update trust score:', error)
    }
}

/**
 * Get trust score breakdown for display
 */
export async function getTrustScoreBreakdown(contractorId: string) {
    const profile = await prisma.contractorProfile.findUnique({
        where: { id: contractorId },
        include: { reviews: true }
    })

    if (!profile) return null

    const customer = await prisma.customer.findUnique({
        where: { id: profile.customerId },
        select: { contractorVerified: true }
    })

    const reviews = profile.reviews as unknown as BasicReview[]
    const reviewCount = reviews.length

    const avgRating = reviewCount > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
        : 0
    const avgPriceAccuracy = reviewCount > 0
        ? reviews.reduce((s, r) => s + (r.priceAccuracy || 5), 0) / reviewCount
        : 5
    const avgMaterialQuality = reviewCount > 0
        ? reviews.reduce((s, r) => s + (r.materialQuality || 5), 0) / reviewCount
        : 5

    return {
        totalScore: profile.trustScore,
        breakdown: {
            base: 50,
            kycVerified: customer?.contractorVerified ? 15 : 0,
            ratingBonus: Math.round(avgRating * 8 * 10) / 10,
            projectsBonus: Math.round(Math.min(30, (profile.totalProjectsCompleted || 0) * 1.5) * 10) / 10,
            pricePenalty: avgPriceAccuracy < 4 ? Math.round((5 - avgPriceAccuracy) * 5 * 10) / 10 : 0,
            materialBonus: Math.round((avgMaterialQuality - 3) * 2 * 10) / 10
        },
        metrics: {
            avgRating: Math.round(avgRating * 10) / 10,
            avgPriceAccuracy: Math.round(avgPriceAccuracy * 10) / 10,
            avgMaterialQuality: Math.round(avgMaterialQuality * 10) / 10,
            reviewCount,
            projectsCompleted: profile.totalProjectsCompleted || 0,
            isVerified: Boolean(customer?.contractorVerified)
        }
    }
}

