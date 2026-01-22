import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * Mapping product keywords/categories to contractor skills
 */
const SKILL_MAPPING: Record<string, string[]> = {
    'xi măng': ['Xây thô'],
    'cát': ['Xây thô'],
    'đá': ['Xây thô'],
    'thép': ['Xây thô'],
    'gạch xây': ['Xây thô'],
    'bê tông': ['Xây thô'],
    'sơn': ['Sơn bả'],
    'bột trét': ['Sơn bả'],
    'gạch ốp': ['Nội thất', 'Xây thô'],
    'gạch lát': ['Nội thất', 'Xây thô'],
    'điện': ['Điện nước'],
    'nước': ['Điện nước'],
    'vòi': ['Điện nước'],
    'sen': ['Điện nước'],
    'đèn': ['Điện nước'],
    'ống': ['Điện nước'],
    'thạch cao': ['Nội thất', 'Sơn bả'],
    'gỗ': ['Nội thất'],
    'cửa': ['Nội thất', 'Sửa chữa'],
}

/**
 * POST /api/recommendations/contractors
 * Suggest contractors based on cart items and location
 */
export async function POST(request: NextRequest) {
    try {
        const { productNames, categories, city } = await request.json()

        if (!productNames || !Array.isArray(productNames)) {
            return NextResponse.json(createErrorResponse('Invalid product data', 'VALIDATION_ERROR'), { status: 400 })
        }

        // 1. Determine required skills based on product names and categories
        const requiredSkillsSet = new Set<string>()

        productNames.forEach(name => {
            const lowerName = name.toLowerCase()
            Object.keys(SKILL_MAPPING).forEach(keyword => {
                if (lowerName.includes(keyword)) {
                    SKILL_MAPPING[keyword].forEach(skill => requiredSkillsSet.add(skill))
                }
            })
        })

        categories?.forEach((cat: string) => {
            Object.keys(SKILL_MAPPING).forEach(keyword => {
                if (cat.toLowerCase().includes(keyword)) {
                    SKILL_MAPPING[keyword].forEach(skill => requiredSkillsSet.add(skill))
                }
            })
        })

        const requiredSkills = Array.from(requiredSkillsSet)

        // 2. Fetch contractors matching these skills and location
        const contractors = await prisma.contractorProfile.findMany({
            where: {
                AND: [
                    { isVerified: true },
                    { onboardingStatus: 'VERIFIED' },
                    {
                        OR: requiredSkills.length > 0
                            ? requiredSkills.map(skill => ({ skills: { has: skill } }))
                            : [{ id: { not: '' } }] // Fallback to all if no specific skill matched
                    },
                    city && city !== 'all' ? { city: { contains: city, mode: 'insensitive' } } : {}
                ]
            },
            orderBy: [
                { trustScore: 'desc' },
                { avgRating: 'desc' }
            ],
            take: 5
        })

        return NextResponse.json(createSuccessResponse({
            contractors: contractors.map(c => ({
                id: c.id,
                displayName: c.displayName,
                companyName: c.companyName,
                skills: c.skills,
                city: c.city,
                avgRating: c.avgRating,
                trustScore: c.trustScore,
                isVerified: c.isVerified,
                totalProjectsCompleted: c.totalProjectsCompleted
            })),
            matchedSkills: requiredSkills
        }))

    } catch (error) {
        console.error('Contractor recommendation error:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'INTERNAL_ERROR'), { status: 500 })
    }
}
