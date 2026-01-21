/**
 * Suggested Projects API for Contractors
 * Returns marketplace projects that match contractor's profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// Mapping project types to contractor skills
const PROJECT_TYPE_TO_SKILLS: Record<string, string[]> = {
    'NEW_CONSTRUCTION': ['CONSTRUCTION', 'MASONRY'],
    'RENOVATION': ['RENOVATION', 'CONSTRUCTION'],
    'INTERIOR': ['INTERIOR', 'CARPENTRY'],
    'EXTERIOR': ['CONSTRUCTION', 'PAINTING', 'ROOFING'],
    'FLOORING': ['FLOORING', 'TILING'],
    'PAINTING': ['PAINTING'],
    'PLUMBING': ['PLUMBING'],
    'ELECTRICAL': ['ELECTRICAL'],
    'ROOFING': ['ROOFING'],
    'OTHER': []
}

interface ScoredProject {
    id: string
    title: string
    description: string
    projectType: string
    location: string
    city: string
    estimatedBudget: number | null
    budgetType: string
    status: string
    contactName: string
    isUrgent: boolean
    isFeatured: boolean
    applicationCount: number
    createdAt: Date
    matchScore: number
    matchReasons: string[]
}

// GET /api/marketplace/projects/suggested
export async function GET(request: NextRequest) {
    try {
        // 1. Authenticate contractor
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        // 2. Get contractor's customer record
        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer || (customer.customerType !== 'CONTRACTOR' && !customer.contractorVerified)) {
            return NextResponse.json(createErrorResponse('Not a contractor', 'FORBIDDEN'), { status: 403 })
        }

        // 3. Get contractor profile for skills and location
        const contractorProfile = await prisma.contractorProfile.findFirst({
            where: { customerId: customer.id }
        })

        const contractorSkills = contractorProfile?.skills || []
        const contractorCity = contractorProfile?.city || ''
        const contractorDistrict = contractorProfile?.district || ''

        // 4. Get all OPEN construction projects
        const projects = await prisma.constructionProject.findMany({
            where: {
                status: 'OPEN'
            },
            include: {
                applications: {
                    select: { id: true, contractorId: true }
                }
            },
            orderBy: [
                { isUrgent: 'desc' },
                { isFeatured: 'desc' },
                { createdAt: 'desc' }
            ]
        })

        // 5. Score and filter projects
        const now = new Date()
        const scoredProjects: ScoredProject[] = []

        for (const project of projects) {
            let score = 0
            const reasons: string[] = []

            // Check if contractor already applied
            const alreadyApplied = project.applications.some(app => app.contractorId === customer.id)
            if (alreadyApplied) continue

            // STRICT FILTER 1: City Match (If contractor has a preferred city)
            if (contractorCity && project.city) {
                if (project.city.toLowerCase() !== contractorCity.toLowerCase()) {
                    continue // Skip projects in other cities
                }
            }

            // A. Skill Match (Weight: 50 points max)
            const requiredSkills = PROJECT_TYPE_TO_SKILLS[project.projectType] || []
            const matchedSkills = requiredSkills.filter(skill =>
                contractorSkills.includes(skill)
            )

            if (matchedSkills.length > 0) {
                const skillScore = (matchedSkills.length / Math.max(requiredSkills.length, 1)) * 50
                score += skillScore
                reasons.push(`Khớp chuyên môn: ${Math.round(skillScore / 50 * 100)}%`)
            }

            // B. Location Match (Weight: 20 points already guaranteed by strict filter, add bonus for District)
            if (contractorCity) {
                score += 20 // Base score for city match
                reasons.push('Đúng khu vực')

                // Bonus for same district
                if (contractorDistrict && project.district) {
                    if (project.district.toLowerCase() === contractorDistrict.toLowerCase()) {
                        score += 10
                        reasons.push('Cùng quận/huyện')
                    }
                }
            }

            // C. Urgency Bonus (Weight: 10 points)
            if (project.isUrgent) {
                score += 10
                reasons.push('Dự án gấp')
            }

            // D. Freshness Bonus (Weight: 10 points - posted within 48h)
            const hoursAgo = (now.getTime() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60)
            if (hoursAgo <= 48) {
                score += 10
                reasons.push('Mới đăng')
            } else if (hoursAgo <= 168) { // Within 7 days
                score += 5
            }

            // E. Budget Consideration (don't add/subtract, just note if available)
            if (project.estimatedBudget && project.estimatedBudget > 0) {
                // This is informational, not a score factor
            }

            // Only include if has at least some match
            if (score > 0) {
                scoredProjects.push({
                    id: project.id,
                    title: project.title,
                    description: project.description,
                    projectType: project.projectType,
                    location: project.location,
                    city: project.city,
                    estimatedBudget: project.estimatedBudget,
                    budgetType: project.budgetType,
                    status: project.status,
                    contactName: project.contactName,
                    isUrgent: project.isUrgent,
                    isFeatured: project.isFeatured,
                    applicationCount: project.applications.length,
                    createdAt: project.createdAt,
                    matchScore: score,
                    matchReasons: reasons.length > 0 ? reasons : ['Dự án mới']
                })
            }
        }

        // 6. Sort by score (descending) and limit to 10
        const sortedProjects = scoredProjects
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 10)

        // 7. Separate into categories for UI
        const urgentProjects = sortedProjects.filter(p => p.isUrgent).slice(0, 3)
        const matchingProjects = sortedProjects.filter(p => !p.isUrgent && p.matchScore >= 30).slice(0, 5)
        const recentProjects = sortedProjects.filter(p => {
            const hoursAgo = (now.getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60)
            return hoursAgo <= 48 && p.matchScore < 30 && !p.isUrgent
        }).slice(0, 5)

        return NextResponse.json(createSuccessResponse({
            all: sortedProjects,
            urgent: urgentProjects,
            matching: matchingProjects,
            recent: recentProjects,
            contractorInfo: {
                skills: contractorSkills,
                city: contractorCity,
                district: contractorDistrict
            },
            total: sortedProjects.length
        }, 'Suggested projects loaded'), { status: 200 })

    } catch (error) {
        console.error('Suggested projects error:', error)
        return NextResponse.json(createErrorResponse('Failed to load suggestions', 'INTERNAL_ERROR'), { status: 500 })
    }
}
