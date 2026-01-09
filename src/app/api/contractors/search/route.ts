import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * Vietnamese diacritics removal for search normalization
 */
function removeDiacritics(str: string): string {
    const diacriticsMap: Record<string, string> = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        // Uppercase
        'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
        'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
        'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
        'Đ': 'D',
        'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
        'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
        'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
        'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
        'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
        'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
        'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
        'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
        'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y'
    }

    return str.split('').map(char => diacriticsMap[char] || char).join('')
}

/**
 * Check if normalized query matches normalized text
 */
function matchesSearch(text: string, query: string): boolean {
    const normalizedText = removeDiacritics(text.toLowerCase())
    const normalizedQuery = removeDiacritics(query.toLowerCase())
    return normalizedText.includes(normalizedQuery)
}

/**
 * GET /api/contractors/search?q=xxx&limit=10
 * Search contractors with autocomplete
 * 
 * GET /api/contractors/search?featured=true&limit=10
 * Get featured/top contractors
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || searchParams.get('query') || ''
        const limit = parseInt(searchParams.get('limit') || '10')
        const featured = searchParams.get('featured') === 'true'
        const city = searchParams.get('city')

        // Featured contractors (no search query)
        if (featured || !query.trim()) {
            const featuredContractors = await prisma.contractorProfile.findMany({
                where: {
                    isVerified: true,
                    ...(city && city !== 'all' ? { city } : {})
                },
                orderBy: [
                    { avgRating: 'desc' },
                    { reviewCount: 'desc' },
                    { totalProjectsCompleted: 'desc' }
                ],
                take: limit
            })

            return NextResponse.json(createSuccessResponse({
                type: 'featured',
                contractors: featuredContractors.map(c => ({
                    id: c.id,
                    displayName: c.displayName,
                    companyName: c.companyName,
                    skills: c.skills,
                    city: c.city,
                    avgRating: c.avgRating,
                    reviewCount: c.reviewCount,
                    totalProjectsCompleted: c.totalProjectsCompleted,
                    isVerified: c.isVerified,
                    trustScore: c.trustScore
                })),
                totalResults: featuredContractors.length
            }))
        }

        // Search with query - fetch all and filter in memory for diacritics support
        const allContractors = await prisma.contractorProfile.findMany({
            where: {
                ...(city && city !== 'all' ? { city } : {})
            },
            orderBy: [
                { avgRating: 'desc' },
                { reviewCount: 'desc' }
            ]
        })

        // Filter by query (supports diacritics-insensitive search)
        const matchedContractors = allContractors.filter(c => {
            const searchableText = [
                c.displayName,
                c.companyName || '',
                c.bio || '',
                ...(c.skills || []),
                c.city || ''
            ].join(' ')

            return matchesSearch(searchableText, query)
        }).slice(0, limit)

        return NextResponse.json(createSuccessResponse({
            type: 'search',
            query,
            contractors: matchedContractors.map(c => ({
                id: c.id,
                displayName: c.displayName,
                companyName: c.companyName,
                skills: c.skills,
                city: c.city,
                avgRating: c.avgRating,
                reviewCount: c.reviewCount,
                totalProjectsCompleted: c.totalProjectsCompleted,
                isVerified: c.isVerified,
                trustScore: c.trustScore,
                // Highlight matching
                highlight: highlightMatch(c.displayName, query)
            })),
            totalResults: matchedContractors.length
        }))

    } catch (error) {
        console.error('Contractor search error:', error)
        return NextResponse.json(
            createErrorResponse('Search failed', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

/**
 * Highlight matching part of text
 */
function highlightMatch(text: string, query: string): string {
    const normalizedText = removeDiacritics(text.toLowerCase())
    const normalizedQuery = removeDiacritics(query.toLowerCase())

    const index = normalizedText.indexOf(normalizedQuery)
    if (index === -1) return text

    // Find corresponding position in original text
    const before = text.slice(0, index)
    const match = text.slice(index, index + query.length)
    const after = text.slice(index + query.length)

    return `${before}<em>${match}</em>${after}`
}

/**
 * POST /api/contractors/search
 * Advanced search with filters
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            query = '',
            skills = [],
            city,
            minRating = 0,
            verified = false,
            limit = 20
        } = body

        // Build where clause
        const whereClause: any = {}

        if (verified) {
            whereClause.isVerified = true
        }

        if (minRating > 0) {
            whereClause.avgRating = { gte: minRating }
        }

        if (city && city !== 'all') {
            whereClause.city = city
        }

        // Fetch contractors
        const contractors = await prisma.contractorProfile.findMany({
            where: whereClause,
            orderBy: [
                { avgRating: 'desc' },
                { reviewCount: 'desc' },
                { totalProjectsCompleted: 'desc' }
            ]
        })

        // Filter by query and skills
        let results = contractors

        if (query.trim()) {
            results = results.filter(c => {
                const searchableText = [
                    c.displayName,
                    c.companyName || '',
                    c.bio || '',
                    ...(c.skills || [])
                ].join(' ')

                return matchesSearch(searchableText, query)
            })
        }

        if (skills.length > 0) {
            results = results.filter(c => {
                const contractorSkills = (c.skills || []).map(s => removeDiacritics(s.toLowerCase()))
                return skills.some((skill: string) =>
                    contractorSkills.some(cs => cs.includes(removeDiacritics(skill.toLowerCase())))
                )
            })
        }

        results = results.slice(0, limit)

        return NextResponse.json(createSuccessResponse({
            type: 'advanced',
            query,
            filters: { skills, city, minRating, verified },
            contractors: results.map(c => ({
                id: c.id,
                displayName: c.displayName,
                companyName: c.companyName,
                bio: c.bio,
                skills: c.skills,
                city: c.city,
                avgRating: c.avgRating,
                reviewCount: c.reviewCount,
                totalProjectsCompleted: c.totalProjectsCompleted,
                experienceYears: c.experienceYears,
                isVerified: c.isVerified,
                trustScore: c.trustScore
            })),
            totalResults: results.length
        }))

    } catch (error) {
        console.error('Advanced contractor search error:', error)
        return NextResponse.json(
            createErrorResponse('Search failed', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
