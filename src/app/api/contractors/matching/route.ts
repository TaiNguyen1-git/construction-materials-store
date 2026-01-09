import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { matchContractors, type ProjectMatchRequest, type ContractorData } from '@/lib/ml-services'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * GET /api/contractors/matching?projectId=xxx
 * Suggests contractors for a specific project using ML-based matching
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')
        const useML = searchParams.get('useML') !== 'false' // Default to true

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
                isVerified: true
            }
        })

        // 3. Try ML-based matching first
        if (useML && contractors.length > 0) {
            const projectData: ProjectMatchRequest = {
                title: project.name,
                description: project.description || '',
                requirements: extractRequirements(project.name + ' ' + (project.description || '')),
                city: project.location || '',
                district: ''
            }

            const contractorData: ContractorData[] = contractors.map(c => ({
                id: c.id,
                displayName: c.displayName,
                skills: c.skills || [],
                bio: c.bio || '',
                city: c.city || '',
                district: '', // Not available in schema
                avgRating: c.avgRating || 0,
                experienceYears: c.experienceYears || 0,
                completedJobs: c.totalProjectsCompleted || 0, // Use totalProjectsCompleted
                isVerified: c.isVerified || false
            }))

            const mlResults = await matchContractors(projectData, contractorData, 5)

            if (mlResults.length > 0) {
                // Map ML results back to contractor objects
                const recommendations = mlResults.map(match => {
                    const contractor = contractors.find(c => c.id === match.contractorId)
                    return {
                        ...contractor,
                        matchScore: match.score * 10, // Scale to match legacy format
                        matchReasons: match.reasons,
                        mlScores: {
                            textSimilarity: match.textSimilarity,
                            profileScore: match.profileScore,
                            locationScore: match.locationScore
                        }
                    }
                }).filter(Boolean)

                return NextResponse.json(createSuccessResponse({
                    recommendations,
                    metadata: {
                        projectId,
                        matchMethod: 'ml-hybrid-tfidf',
                        source: 'ml-service'
                    }
                }), { status: 200 })
            }
        }

        // 4. Fallback: Simple keyword-based scoring
        const projectText = (project.name + ' ' + (project.description || '')).toLowerCase()

        const scoredContractors = contractors.map(contractor => {
            let score = 0
            const reasons: string[] = []

            // A. Skill Match (Weight: 5.0)
            const matchedSkills = contractor.skills.filter((skill: string) =>
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
            if (contractor.totalProjectsCompleted > 10) {
                score += 1.5
                reasons.push('Dày dạn kinh nghiệm (>10 dự án)')
            }

            return {
                ...contractor,
                matchScore: score,
                matchReasons: reasons
            }
        })

        // 5. Filter and Sort
        const recommendations = scoredContractors
            .filter(c => c.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5)

        return NextResponse.json(createSuccessResponse({
            recommendations,
            metadata: {
                projectId,
                matchMethod: 'keyword-weighted-scoring',
                source: 'fallback'
            }
        }), { status: 200 })

    } catch (error) {
        console.error('Matching error:', error)
        return NextResponse.json(createErrorResponse('Matching failed', 'INTERNAL_ERROR'), { status: 500 })
    }
}

/**
 * Extract requirements from project text
 */
function extractRequirements(text: string): string[] {
    const keywords = [
        'thợ hồ', 'xây dựng', 'nền móng', 'cải tạo', 'sửa chữa', 'nội thất',
        'lát gạch', 'sơn', 'điện', 'nước', 'mái', 'chống thấm', 'ốp lát'
    ]

    const textLower = text.toLowerCase()
    return keywords.filter(kw => textLower.includes(kw))
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
