import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * GET /api/contractors/matching?projectId=xxx
 * Suggests contractors for a specific project using simple ML-like scoring
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')

        if (!projectId) {
            return NextResponse.json(createErrorResponse('Project ID required', 'VALIDATION_ERROR'), { status: 400 })
        }

        // 1. Get Project Details
        const project = await (prisma as any).project.findUnique({
            where: { id: projectId }
        })

        if (!project) {
            return NextResponse.json(createErrorResponse('Project not found', 'NOT_FOUND'), { status: 404 })
        }

        // 2. Fetch All Verified Contractors
        const contractors = await prisma.contractorProfile.findMany({
            where: {
                // In a real app, we might filter by city here too
                isVerified: true
            }
        })

        // 3. Scoring Logic (Simple ML Matching)
        const projectText = (project.name + ' ' + (project.description || '')).toLowerCase()

        const scoredContractors = contractors.map(contractor => {
            let score = 0
            const reasons = []

            // A. Skill Match (Weight: 5.0)
            const matchedSkills = contractor.skills.filter(skill =>
                projectText.includes(skill.toLowerCase()) ||
                getSkillKeywords(skill).some(kw => projectText.includes(kw))
            )

            if (matchedSkills.length > 0) {
                score += 5.0 * matchedSkills.length
                reasons.push(`Phù hợp chuyên môn: ${matchedSkills.join(', ')}`)
            }

            // B. Reputation/Rating (Weight: 2.0)
            if (contractor.avgRating >= 4.5) {
                score += 2.0
                reasons.push('Đánh giá xuất sắc (>4.5⭐)')
            } else if (contractor.avgRating >= 4.0) {
                score += 1.0
                reasons.push('Đánh giá tốt')
            }

            // C. Experience (Weight: 1.5)
            if (contractor.completedJobs > 10) {
                score += 1.5
                reasons.push('Dày dạn kinh nghiệm (>10 dự án)')
            }

            return {
                ...contractor,
                matchScore: score,
                matchReasons: reasons
            }
        })

        // 4. Filter and Sort
        const recommendations = scoredContractors
            .filter(c => c.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5)

        return NextResponse.json(createSuccessResponse({
            recommendations,
            metadata: {
                projectId,
                matchMethod: 'keyword-weighted-scoring'
            }
        }), { status: 200 })

    } catch (error) {
        console.error('Matching error:', error)
        return NextResponse.json(createErrorResponse('Matching failed', 'INTERNAL_ERROR'), { status: 500 })
    }
}

function getSkillKeywords(skill: string): string[] {
    const map: Record<string, string[]> = {
        'CONSTRUCTION': ['xây dựng', 'xây nhà', 'nền móng'],
        'RENOVATION': ['cải tạo', 'sửa chữa', 'nâng cấp'],
        'INTERIOR': ['nội thất', 'decor', 'trang trí'],
        'FLOORING': ['lát gạch', 'lát sàn', 'ốp tường'],
        'PAINTING': ['sơn', 'bả', 'quét vôi'],
        'PLUMBING': ['điện nước', 'ống nước', 'vệ sinh'],
        'ELECTRICAL': ['điện', 'hệ thống điện'],
        'ROOFING': ['mái', 'lợp mái', 'chống thấm'],
        'TILING': ['ốp lát', 'gạch men']
    }
    return map[skill] || []
}
