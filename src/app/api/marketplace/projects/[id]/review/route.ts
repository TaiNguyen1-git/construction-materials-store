/**
 * Project Review API
 * Allow project owners to review contractors after project completion
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// POST - Submit a review for contractor
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const payload = verifyTokenFromRequest(request)

        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const {
            contractorId,
            rating,
            comment,
            qualityRating,
            communicationRating,
            timelinessRating,
            projectImages
        } = body

        // Validate
        if (!contractorId || !rating) {
            return NextResponse.json(
                createErrorResponse('Thiếu thông tin đánh giá', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                createErrorResponse('Số sao phải từ 1-5', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Get project
        const project = await prisma.constructionProject.findUnique({
            where: { id: projectId }
        })

        if (!project) {
            return NextResponse.json(createErrorResponse('Không tìm thấy dự án', 'NOT_FOUND'), { status: 404 })
        }

        // Get customer
        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Không tìm thấy thông tin', 'NOT_FOUND'), { status: 404 })
        }

        // Check if already reviewed
        const existingReview = await prisma.contractorReview.findFirst({
            where: {
                contractorId,
                reviewerId: customer.id
            }
        })

        if (existingReview) {
            return NextResponse.json(
                createErrorResponse('Bạn đã đánh giá nhà thầu này rồi', 'CONFLICT'),
                { status: 409 }
            )
        }

        // Get contractor profile
        const contractorProfile = await prisma.contractorProfile.findFirst({
            where: { customerId: contractorId }
        })

        if (!contractorProfile) {
            return NextResponse.json(
                createErrorResponse('Không tìm thấy hồ sơ nhà thầu', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        // Create review
        const review = await prisma.contractorReview.create({
            data: {
                contractorId: contractorProfile.id,
                reviewerId: customer.id,
                rating,
                comment: comment || '',
                metadata: {
                    projectId,
                    projectTitle: project.title,
                    qualityRating: qualityRating || rating,
                    communicationRating: communicationRating || rating,
                    timelinessRating: timelinessRating || rating,
                    projectImages: projectImages || []
                }
            } as any
        }) as any

        const allReviews = await prisma.contractorReview.findMany({
            where: { contractorId: contractorProfile.id }
        })

        const avgRating = allReviews.length > 0
            ? allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length
            : 0
        const reviewCount = allReviews.length

        // Update trust score based on reviews
        let trustBonus = 0
        if (avgRating >= 4.5) trustBonus = 5
        else if (avgRating >= 4.0) trustBonus = 3
        else if (avgRating >= 3.5) trustBonus = 1
        else if (avgRating < 3.0) trustBonus = -5

        const currentTrust = contractorProfile.trustScore || 100
        const newTrust = Math.min(100, Math.max(0, currentTrust + trustBonus))

        // If good rating and project images provided, add to featured projects
        let featuredProjects = (contractorProfile.featuredProjects as any[]) || []
        if (rating >= 4 && projectImages && projectImages.length > 0) {
            featuredProjects = [
                {
                    title: project.title,
                    year: new Date().getFullYear(),
                    image: projectImages[0],
                    desc: comment ? comment.substring(0, 100) : `Dự án ${project.projectType}`,
                    rating,
                    source: 'auto'
                },
                ...featuredProjects.slice(0, 4) // Keep max 5 featured projects
            ]
        }

        await prisma.contractorProfile.update({
            where: { id: contractorProfile.id },
            data: {
                avgRating: Math.round(avgRating * 10) / 10,
                reviewCount,
                trustScore: newTrust,
                totalProjectsCompleted: { increment: 1 },
                featuredProjects
            }
        })

        // Update project status to completed
        await prisma.constructionProject.update({
            where: { id: projectId },
            data: { status: 'COMPLETED' }
        })

        // Notify contractor
        await prisma.notification.create({
            data: {
                type: 'ORDER_UPDATE',
                title: rating >= 4 ? '⭐ Bạn nhận được đánh giá tốt!' : 'Bạn có đánh giá mới',
                message: `Dự án "${project.title}" đã hoàn thành. Bạn được đánh giá ${rating}/5 sao.`,
                priority: rating >= 4 ? 'MEDIUM' : 'LOW',
                read: false,
                userId: null,
                metadata: {
                    reviewId: review.id,
                    contractorId,
                    rating
                }
            }
        })

        return NextResponse.json(
            createSuccessResponse({
                review,
                newStats: {
                    avgRating: Math.round(avgRating * 10) / 10,
                    reviewCount,
                    trustScore: newTrust
                }
            }, 'Đã gửi đánh giá thành công'),
            { status: 201 }
        )
    } catch (error) {
        console.error('Submit review error:', error)
        return NextResponse.json(createErrorResponse('Lỗi gửi đánh giá', 'SERVER_ERROR'), { status: 500 })
    }
}

// GET - Check if review exists and get project review status
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const payload = verifyTokenFromRequest(request)

        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json(
                createSuccessResponse({ canReview: false, reviewed: false }, 'OK'),
                { status: 200 }
            )
        }

        // Get selected application for this project
        const selectedApp = await prisma.projectApplication.findFirst({
            where: {
                projectId,
                status: 'SELECTED'
            }
        })

        if (!selectedApp || !selectedApp.contractorId) {
            return NextResponse.json(
                createSuccessResponse({ canReview: false, reviewed: false, reason: 'No contractor selected' }, 'OK'),
                { status: 200 }
            )
        }

        // Check if already reviewed
        const contractorProfile = await prisma.contractorProfile.findFirst({
            where: { customerId: selectedApp.contractorId }
        })

        if (!contractorProfile) {
            return NextResponse.json(
                createSuccessResponse({ canReview: false, reviewed: false }, 'OK'),
                { status: 200 }
            )
        }

        const existingReview = await prisma.contractorReview.findFirst({
            where: {
                contractorId: contractorProfile.id,
                reviewerId: customer.id
            }
        })

        return NextResponse.json(
            createSuccessResponse({
                canReview: !existingReview,
                reviewed: !!existingReview,
                review: existingReview,
                contractorId: selectedApp.contractorId
            }, 'OK'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get review status error:', error)
        return NextResponse.json(createErrorResponse('Lỗi', 'SERVER_ERROR'), { status: 500 })
    }
}
