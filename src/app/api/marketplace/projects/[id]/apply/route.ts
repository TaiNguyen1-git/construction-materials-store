/**
 * Project Application API - Contractors apply to projects
 * Supports: Guest applications, BoQ materials, Attachments
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST /api/marketplace/projects/[id]/apply - Apply to a project
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const body = await request.json()

        const {
            message,
            proposedBudget,
            proposedDays,
            contractorId,
            // Guest fields
            isGuest,
            guestName,
            guestPhone,
            guestEmail,
            // BoQ Integration
            materials,
            // Attachments
            attachments
        } = body

        // Validation - Guest requires name and phone
        if (isGuest) {
            if (!guestName || !guestPhone) {
                return NextResponse.json(
                    createErrorResponse('Vui lòng nhập họ tên và số điện thoại', 'VALIDATION_ERROR'),
                    { status: 400 }
                )
            }
            if (!message) {
                return NextResponse.json(
                    createErrorResponse('Vui lòng nhập lời nhắn', 'VALIDATION_ERROR'),
                    { status: 400 }
                )
            }
        } else {
            // Logged-in contractor
            if (!message || !contractorId) {
                return NextResponse.json(
                    createErrorResponse('Cần có lời nhắn và thông tin nhà thầu', 'VALIDATION_ERROR'),
                    { status: 400 }
                )
            }
        }

        // Check if project exists and is open
        const project = await prisma.constructionProject.findUnique({
            where: { id: projectId }
        })

        if (!project) {
            return NextResponse.json(
                createErrorResponse('Không tìm thấy dự án', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        if (project.status !== 'OPEN') {
            return NextResponse.json(
                createErrorResponse('Dự án đã đóng tuyển', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Check if already applied (only for logged-in contractors)
        if (!isGuest && contractorId) {
            const existingApplication = await prisma.projectApplication.findFirst({
                where: {
                    projectId,
                    contractorId
                }
            })

            if (existingApplication) {
                return NextResponse.json(
                    createErrorResponse('Bạn đã ứng tuyển dự án này rồi', 'CONFLICT'),
                    { status: 409 }
                )
            }
        }

        // Create application
        const application = await prisma.projectApplication.create({
            data: {
                projectId,
                contractorId: isGuest ? null : contractorId,
                isGuest: isGuest || false,
                guestName: isGuest ? guestName : null,
                guestPhone: isGuest ? guestPhone : null,
                guestEmail: isGuest ? guestEmail : null,
                message,
                proposedBudget: proposedBudget || null,
                proposedDays: proposedDays || null,
                materials: materials || null,
                attachments: attachments || [],
                isContactUnlocked: false,
                status: 'PENDING'
            }
        })

        // Create notification for project owner
        const applicantName = isGuest ? guestName : 'Nhà thầu đã xác minh'
        await prisma.notification.create({
            data: {
                type: 'ORDER_NEW',
                title: 'Có nhà thầu ứng tuyển mới',
                message: `Dự án "${project.title}" có ${isGuest ? 'hồ sơ tự khai báo' : 'nhà thầu xác minh'} ứng tuyển: ${applicantName}`,
                priority: isGuest ? 'LOW' : 'MEDIUM',
                read: false,
                userId: null,
                metadata: {
                    projectId,
                    applicationId: application.id,
                    isGuest
                }
            }
        })

        return NextResponse.json(
            createSuccessResponse({ application }, 'Ứng tuyển thành công'),
            { status: 201 }
        )
    } catch (error) {
        console.error('Apply to project error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi khi gửi ứng tuyển', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}

// GET /api/marketplace/projects/[id]/apply - Get applications for a project
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params

        const applications = await prisma.projectApplication.findMany({
            where: { projectId },
            orderBy: [
                { status: 'asc' }, // SELECTED first
                { isGuest: 'asc' }, // Verified contractors first
                { createdAt: 'desc' }
            ]
        })

        // Enrich with contractor profiles for non-guest applications
        const enrichedApplications = await Promise.all(
            applications.map(async (app) => {
                if (!app.isGuest && app.contractorId) {
                    // Get contractor profile
                    const profile = await prisma.contractorProfile.findFirst({
                        where: { customerId: app.contractorId }
                    })

                    // Mask contact if not unlocked
                    const maskedPhone = app.isContactUnlocked
                        ? profile?.phone
                        : profile?.phone?.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')

                    return {
                        ...app,
                        contractor: profile ? {
                            displayName: profile.displayName,
                            phone: maskedPhone,
                            isVerified: profile.isVerified,
                            trustScore: profile.trustScore,
                            avgRating: profile.avgRating,
                            totalProjectsCompleted: profile.totalProjectsCompleted,
                            skills: profile.skills,
                            highlightBio: profile.highlightBio,
                            experienceYears: profile.experienceYears
                        } : null,
                        tier: profile?.isVerified ? 'VERIFIED_PARTNER' : 'CERTIFIED_MEMBER'
                    }
                } else {
                    // Mask guest contact if not unlocked
                    const maskedPhone = app.isContactUnlocked
                        ? app.guestPhone
                        : app.guestPhone?.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')

                    return {
                        ...app,
                        guestPhone: maskedPhone,
                        contractor: null,
                        tier: 'PROVISIONAL'
                    }
                }
            })
        )

        // Separate by tier for UI
        const verified = enrichedApplications.filter(a => a.tier === 'VERIFIED_PARTNER')
        const certified = enrichedApplications.filter(a => a.tier === 'CERTIFIED_MEMBER')
        const provisional = enrichedApplications.filter(a => a.tier === 'PROVISIONAL')

        return NextResponse.json(
            createSuccessResponse({
                applications: enrichedApplications,
                verified,
                certified,
                provisional,
                total: applications.length,
                stats: {
                    verifiedCount: verified.length,
                    certifiedCount: certified.length,
                    provisionalCount: provisional.length
                }
            }, 'Danh sách ứng tuyển'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get applications error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi khi tải danh sách', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}

// PATCH /api/marketplace/projects/[id]/apply - Update application status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const body = await request.json()

        const { applicationId, action } = body

        if (!applicationId || !action) {
            return NextResponse.json(
                createErrorResponse('Thiếu thông tin', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const application = await prisma.projectApplication.findUnique({
            where: { id: applicationId }
        })

        if (!application || application.projectId !== projectId) {
            return NextResponse.json(
                createErrorResponse('Không tìm thấy hồ sơ ứng tuyển', 'NOT_FOUND'),
                { status: 404 }
            )
        }

        let updateData: any = {}
        let notifyMessage = ''

        switch (action) {
            case 'UNLOCK_CONTACT':
                updateData = { isContactUnlocked: true }
                notifyMessage = 'Đã mở khóa thông tin liên hệ'
                break

            case 'SHORTLIST':
                updateData = { status: 'SHORTLISTED' }
                notifyMessage = 'Đã thêm vào danh sách ngắn'
                break

            case 'NEGOTIATE':
                updateData = { status: 'NEGOTIATING', isContactUnlocked: true }
                notifyMessage = 'Đang thương thảo'
                break

            case 'SELECT':
                updateData = { status: 'SELECTED', isContactUnlocked: true }
                notifyMessage = 'Đã chọn nhà thầu này'

                // Close other applications
                await prisma.projectApplication.updateMany({
                    where: {
                        projectId,
                        id: { not: applicationId },
                        status: { notIn: ['REJECTED', 'CLOSED'] }
                    },
                    data: { status: 'CLOSED' }
                })

                // Update project status
                await prisma.constructionProject.update({
                    where: { id: projectId },
                    data: { status: 'IN_PROGRESS' }
                })
                break

            case 'REJECT':
                updateData = { status: 'REJECTED' }
                notifyMessage = 'Đã từ chối'
                break

            default:
                return NextResponse.json(
                    createErrorResponse('Hành động không hợp lệ', 'VALIDATION_ERROR'),
                    { status: 400 }
                )
        }

        const updated = await prisma.projectApplication.update({
            where: { id: applicationId },
            data: updateData
        })

        return NextResponse.json(
            createSuccessResponse({ application: updated }, notifyMessage),
            { status: 200 }
        )
    } catch (error) {
        console.error('Update application error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi cập nhật', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
