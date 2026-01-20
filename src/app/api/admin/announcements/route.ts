
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (payload?.role !== 'MANAGER') {
            return NextResponse.json(createErrorResponse('Không có quyền truy cập', 'FORBIDDEN'), { status: 403 })
        }

        const announcements = await (prisma as any).systemAnnouncement.findMany({
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(createSuccessResponse(announcements))
    } catch (error) {
        return NextResponse.json(createErrorResponse('Lỗi lấy danh sách', 'SERVER_ERROR'), { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, content, type, isActive, startTime, endTime, displayMode, imageUrl, actionLabel, actionUrl, targetPath } = body

        const announcement = await (prisma as any).systemAnnouncement.create({
            data: {
                title,
                content,
                type, // MAINTENANCE, FEATURE, POLICY, INFO
                displayMode: displayMode || 'MODAL',
                imageUrl,
                actionLabel,
                actionUrl,
                targetPath,
                isActive,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : null
            }
        })

        return NextResponse.json(createSuccessResponse(announcement))
    } catch (error) {
        return NextResponse.json(createErrorResponse('Lỗi tạo thông báo', 'SERVER_ERROR'), { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, isActive } = body // Support quick toggle or full update

        // Simpler support: just update isActive
        const announcement = await (prisma as any).systemAnnouncement.update({
            where: { id },
            data: { isActive }
        })

        return NextResponse.json(createSuccessResponse(announcement))
    } catch (error) {
        return NextResponse.json(createErrorResponse('Lỗi cập nhật', 'SERVER_ERROR'), { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json(createErrorResponse('Mising ID', 'BAD_REQUEST'), { status: 400 })

        await (prisma as any).systemAnnouncement.delete({ where: { id } })
        return NextResponse.json(createSuccessResponse({ success: true }))
    } catch (error) {
        return NextResponse.json(createErrorResponse('Lỗi xóa', 'SERVER_ERROR'), { status: 500 })
    }
}
