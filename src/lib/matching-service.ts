/**
 * Contractor-Project Matching Service
 * Local scoring algorithm - NOT using Gemini API to save quota
 * 
 * Matching factors:
 * 1. Skill match (40%)
 * 2. Location match (25%)
 * 3. Rating & reviews (20%)
 * 4. Availability (15%)
 */

interface ContractorData {
    id: string
    displayName: string
    skills: string[]
    city: string
    district?: string | null
    experienceYears: number
    teamSize: number
    isVerified: boolean
    avgRating: number
    totalReviews: number
    completedJobs: number
    isAvailable: boolean
}

interface ProjectData {
    id: string
    title: string
    projectType: string
    city: string
    district?: string | null
    estimatedBudget?: number | null
}

interface MatchResult {
    contractor: ContractorData
    score: number
    matchDetails: {
        skillScore: number
        locationScore: number
        ratingScore: number
        availabilityScore: number
    }
    reasons: string[]
}

// Mapping project types to required skills
const PROJECT_TO_SKILLS: Record<string, string[]> = {
    NEW_CONSTRUCTION: ['CONSTRUCTION', 'MASONRY'],
    RENOVATION: ['RENOVATION', 'CONSTRUCTION'],
    INTERIOR: ['INTERIOR', 'CARPENTRY'],
    EXTERIOR: ['CONSTRUCTION', 'PAINTING'],
    FLOORING: ['FLOORING', 'TILING', 'MASONRY'],
    PAINTING: ['PAINTING'],
    PLUMBING: ['PLUMBING'],
    ELECTRICAL: ['ELECTRICAL'],
    ROOFING: ['ROOFING', 'CONSTRUCTION'],
    OTHER: []
}

/**
 * Calculate match score between a contractor and a project
 */
export function calculateMatchScore(
    contractor: ContractorData,
    project: ProjectData
): MatchResult {
    const reasons: string[] = []

    // 1. Skill Match (40% weight)
    const requiredSkills = PROJECT_TO_SKILLS[project.projectType] || []
    const contractorSkills = contractor.skills || []

    let skillMatchCount = 0
    requiredSkills.forEach(skill => {
        if (contractorSkills.includes(skill)) {
            skillMatchCount++
        }
    })

    const skillScore = requiredSkills.length > 0
        ? (skillMatchCount / requiredSkills.length) * 100
        : 50 // Default if no specific skills required

    if (skillScore >= 80) {
        reasons.push(`Chuyên môn phù hợp: ${skillMatchCount}/${requiredSkills.length} kỹ năng`)
    }

    // 2. Location Match (25% weight)
    let locationScore = 0
    if (contractor.city === project.city) {
        locationScore = 70
        if (contractor.district && project.district &&
            contractor.district === project.district) {
            locationScore = 100
            reasons.push(`Cùng quận ${project.district}`)
        } else {
            reasons.push(`Cùng thành phố ${project.city}`)
        }
    } else {
        locationScore = 30
    }

    // 3. Rating & Experience Score (20% weight)
    let ratingScore = 0

    // Base rating score (0-50)
    ratingScore += (contractor.avgRating / 5) * 50

    // Review count bonus (0-25)
    const reviewBonus = Math.min(contractor.totalReviews / 20, 1) * 25
    ratingScore += reviewBonus

    // Verified bonus (0-25)
    if (contractor.isVerified) {
        ratingScore += 25
        reasons.push('Đã xác minh ✓')
    }

    if (contractor.avgRating >= 4.5) {
        reasons.push(`Đánh giá cao: ${contractor.avgRating.toFixed(1)}⭐`)
    }

    // 4. Availability Score (15% weight)
    let availabilityScore = contractor.isAvailable ? 100 : 0

    if (contractor.isAvailable) {
        reasons.push('Đang nhận việc')
    }

    // Calculate final weighted score
    const finalScore =
        (skillScore * 0.4) +
        (locationScore * 0.25) +
        (ratingScore * 0.2) +
        (availabilityScore * 0.15)

    return {
        contractor,
        score: Math.round(finalScore),
        matchDetails: {
            skillScore: Math.round(skillScore),
            locationScore: Math.round(locationScore),
            ratingScore: Math.round(ratingScore),
            availabilityScore: Math.round(availabilityScore)
        },
        reasons
    }
}

/**
 * Find best matching contractors for a project
 */
export function findMatchingContractors(
    contractors: ContractorData[],
    project: ProjectData,
    limit: number = 5
): MatchResult[] {
    const results = contractors.map(c => calculateMatchScore(c, project))

    // Sort by score descending
    results.sort((a, b) => b.score - a.score)

    // Return top matches
    return results.slice(0, limit)
}

/**
 * Find best matching projects for a contractor
 */
export function findMatchingProjects(
    projects: ProjectData[],
    contractor: ContractorData,
    limit: number = 5
): { project: ProjectData; score: number; reasons: string[] }[] {
    const results = projects.map(project => {
        const match = calculateMatchScore(contractor, project)
        return {
            project,
            score: match.score,
            reasons: match.reasons
        }
    })

    results.sort((a, b) => b.score - a.score)
    return results.slice(0, limit)
}

/**
 * Get match quality label
 */
export function getMatchQuality(score: number): { label: string; color: string } {
    if (score >= 80) return { label: 'Rất phù hợp', color: 'green' }
    if (score >= 60) return { label: 'Khá phù hợp', color: 'blue' }
    if (score >= 40) return { label: 'Tạm được', color: 'yellow' }
    return { label: 'Ít phù hợp', color: 'gray' }
}
