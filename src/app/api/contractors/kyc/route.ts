/**
 * API: Contractor KYC Submission
 * POST - Submit KYC documents for verification
 * GET - Get current KYC status
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { saveNotificationForAllManagers } from '@/lib/notification-service'

// GET /api/contractors/kyc - Get current KYC status
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        // Find customer record
        const customer = await prisma.customer.findFirst({
            where: { userId },
            select: {
                id: true,
                contractorVerified: true,
                taxId: true,
                companyName: true,
                companyAddress: true
            }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Không tìm thấy thông tin khách hàng', 'NOT_FOUND'), { status: 404 })
        }

        // Get contractor profile
        const profile = await prisma.contractorProfile.findUnique({
            where: { customerId: customer.id },
            select: {
                id: true,
                displayName: true,
                isVerified: true,
                trustScore: true,
                totalProjectsCompleted: true
            }
        })

        return NextResponse.json(createSuccessResponse({
            customer,
            profile,
            kycStatus: customer.contractorVerified ? 'VERIFIED' : (profile ? 'PENDING' : 'NOT_SUBMITTED')
        }))

    } catch (error: any) {
        console.error('Get KYC status error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ nội bộ', 'INTERNAL_ERROR'), { status: 500 })
    }
}

// POST /api/contractors/kyc - Submit KYC documents
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const {
            displayName,
            companyName,
            taxId,
            companyAddress,
            phone,
            email,
            experienceYears,
            skills,
            city,
            bio,
            // KYC Documents
            idCardFront,
            idCardBack,
            businessLicense
        } = body

        // Validation
        if (!displayName || displayName.trim().length < 2) {
            return NextResponse.json(createErrorResponse('Tên hiển thị phải có ít nhất 2 ký tự', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Find customer record
        const customer = await prisma.customer.findFirst({
            where: { userId },
            include: { user: true }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Không tìm thấy thông tin khách hàng', 'NOT_FOUND'), { status: 404 })
        }

        // Update customer with company info
        await prisma.customer.update({
            where: { id: customer.id },
            data: {
                customerType: 'CONTRACTOR',
                companyName: companyName || null,
                taxId: taxId || null,
                companyAddress: companyAddress || null
            }
        })

        // Create or update contractor profile
        const existingProfile = await prisma.contractorProfile.findUnique({
            where: { customerId: customer.id }
        })

        let profile
        if (existingProfile) {
            profile = await prisma.contractorProfile.update({
                where: { id: existingProfile.id },
                data: {
                    displayName: displayName.trim(),
                    companyName: companyName || null,
                    phone: phone || null,
                    email: email || null,
                    experienceYears: experienceYears || null,
                    skills: skills || [],
                    city: city || null,
                    bio: bio || null,
                    isVerified: false // Reset verification on update
                }
            })
        } else {
            profile = await prisma.contractorProfile.create({
                data: {
                    customerId: customer.id,
                    displayName: displayName.trim(),
                    companyName: companyName || null,
                    phone: phone || null,
                    email: email || null,
                    experienceYears: experienceYears || null,
                    skills: skills || [],
                    city: city || null,
                    bio: bio || null,
                    isVerified: false,
                    trustScore: 50 // Starting trust score
                }
            })
        }

        // Notify all managers about new KYC submission
        try {
            await saveNotificationForAllManagers({
                type: 'ORDER_UPDATE' as any,
                priority: 'MEDIUM',
                title: '📋 Hồ sơ nhà thầu mới cần duyệt',
                message: `${displayName}${companyName ? ` (${companyName})` : ''} vừa gửi hồ sơ đăng ký nhà thầu. Vui lòng xem xét và duyệt.`,
                data: {
                    customerId: customer.id,
                    profileId: profile.id,
                    displayName,
                    companyName,
                    taxId,
                    idCardFront,
                    idCardBack,
                    businessLicense
                }
            })
        } catch (e) {
            console.error('Failed to send notification to managers:', e)
        }

        return NextResponse.json(createSuccessResponse({
            profile,
            message: 'Hồ sơ đã được gửi thành công. Quản trị viên sẽ xem xét trong 1-2 ngày làm việc.'
        }, 'Đăng ký nhà thầu thành công'))

    } catch (error: any) {
        console.error('Submit KYC error:', error)
        return NextResponse.json(createErrorResponse('Lỗi máy chủ nội bộ', 'INTERNAL_ERROR'), { status: 500 })
    }
}
