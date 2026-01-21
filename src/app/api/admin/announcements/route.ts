
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
        const payload = verifyTokenFromRequest(request)
        if (payload?.role !== 'MANAGER') {
            return NextResponse.json(createErrorResponse('Không có quyền thực hiện', 'FORBIDDEN'), { status: 403 })
        }

        const body = await request.json()
        const { title, content, type, isActive, startTime, endTime, displayMode, imageUrl, actionLabel, actionUrl, targetPath } = body

        const announcement = await prisma.systemAnnouncement.create({
            data: {
                title,
                content,
                type, // MAINTENANCE, FEATURE, POLICY, INFO
                displayMode: displayMode || 'MODAL',
                imageUrl: imageUrl || null,
                actionLabel: actionLabel || null,
                actionUrl: actionUrl || null,
                targetPath: targetPath || null,
                isActive: isActive !== undefined ? isActive : true,
                startTime: startTime ? new Date(startTime) : new Date(),
                endTime: endTime ? new Date(endTime) : null
            }
        })

        return NextResponse.json(createSuccessResponse(announcement))
    } catch (error: any) {
        console.error('❌ Error creating announcement:', error);
        return NextResponse.json(createErrorResponse(`Lỗi tạo thông báo: ${error.message}`, 'SERVER_ERROR'), { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (payload?.role !== 'MANAGER') {
            return NextResponse.json(createErrorResponse('Không có quyền thực hiện', 'FORBIDDEN'), { status: 403 })
        }

        const body = await request.json()
        const { id, isActive, startTime, endTime, ...rest } = body

        const updateData: any = { ...rest }
        if (isActive !== undefined) updateData.isActive = isActive
        if (startTime) updateData.startTime = new Date(startTime)
        if (endTime) updateData.endTime = new Date(endTime)

        const announcement = await prisma.systemAnnouncement.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(createSuccessResponse(announcement))
    } catch (error: any) {
        console.error('❌ Error updating announcement:', error);
        return NextResponse.json(createErrorResponse(`Lỗi cập nhật: ${error.message}`, 'SERVER_ERROR'), { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (payload?.role !== 'MANAGER') {
            return NextResponse.json(createErrorResponse('Không có quyền thực hiện', 'FORBIDDEN'), { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json(createErrorResponse('Mising ID', 'BAD_REQUEST'), { status: 400 })

        await prisma.systemAnnouncement.delete({ where: { id } })
        return NextResponse.json(createSuccessResponse({ success: true }))
    } catch (error: any) {
        console.error('❌ Error deleting announcement:', error);
        return NextResponse.json(createErrorResponse(`Lỗi xóa: ${error.message}`, 'SERVER_ERROR'), { status: 500 })
    }
}
