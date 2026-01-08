/**
 * API: Apply to Market Project
 * POST - Submit an application to a project
 * GET - Get applications for a project
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: projectId } = await params

        const applications = await prisma.marketProjectApplication.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({
            success: true,
            data: applications
        })

    } catch (error) {
        console.error('Error fetching applications:', error)
        return NextResponse.json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Lỗi khi lấy danh sách ứng tuyển' }
        }, { status: 500 })
    }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: projectId } = await params
        const body = await request.json()

        const { contractorId, message, proposedBudget, proposedDays } = body

        // Validation
        if (!contractorId) {
            return NextResponse.json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Thiếu contractorId' }
            }, { status: 400 })
        }

        if (!message || message.trim().length < 10) {
            return NextResponse.json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Tin nhắn ứng tuyển phải có ít nhất 10 ký tự' }
            }, { status: 400 })
        }

        // Check if project exists
        const project = await prisma.marketProject.findUnique({
            where: { id: projectId }
        })

        if (!project) {
            return NextResponse.json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Không tìm thấy dự án' }
            }, { status: 404 })
        }

        // Check if already applied
        const existingApplication = await prisma.marketProjectApplication.findFirst({
            where: {
                projectId,
                contractorId
            }
        })

        if (existingApplication) {
            return NextResponse.json({
                success: false,
                error: { code: 'DUPLICATE', message: 'Bạn đã ứng tuyển dự án này rồi' }
            }, { status: 400 })
        }

        // Create application
        const application = await prisma.marketProjectApplication.create({
            data: {
                projectId,
                contractorId,
                message: message.trim(),
                proposedBudget: proposedBudget || null,
                proposedDays: proposedDays || null,
                status: 'PENDING'
            }
        })

        return NextResponse.json({
            success: true,
            data: application,
            message: 'Đã gửi ứng tuyển thành công!'
        })

    } catch (error) {
        console.error('Error creating application:', error)
        return NextResponse.json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Lỗi khi gửi ứng tuyển' }
        }, { status: 500 })
    }
}
