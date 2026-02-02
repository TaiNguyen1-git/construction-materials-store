import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET /api/supplier/notifications?supplierId=...
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')

        if (!supplierId) {
            return NextResponse.json(createErrorResponse('Missing supplierId'), { status: 400 })
        }

        const notificationModel = (prisma as any).notification;
        if (!notificationModel) {
            console.error('Prisma model "notification" not found in client');
            return NextResponse.json(createSuccessResponse({ notifications: [], unreadCount: 0 }));
        }

        const notifications = await notificationModel.findMany({
            where: { supplierId },
            orderBy: { createdAt: 'desc' },
            take: 50
        }).catch((e: any) => {
            console.error('Error fetching notifications:', e.message);
            return [];
        });

        const unreadCount = await notificationModel.count({
            where: { supplierId, read: false }
        }).catch(() => 0);

        return NextResponse.json(createSuccessResponse({
            notifications,
            unreadCount
        }))
    } catch (error: any) {
        console.error('Fetch notifications error:', error)
        return NextResponse.json(createErrorResponse(
            process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        ), { status: 500 })
    }
}

// PATCH /api/supplier/notifications/read
export async function PATCH(request: NextRequest) {
    try {
        const { id, supplierId, all } = await request.json()

        if (all && supplierId) {
            const notificationModel = (prisma as any).notification;
            if (notificationModel) {
                await notificationModel.updateMany({
                    where: { supplierId, read: false },
                    data: { read: true }
                })
            }
            return NextResponse.json(createSuccessResponse(null, 'Đã đánh dấu tất cả là đã đọc'))
        }

        if (!id) {
            return NextResponse.json(createErrorResponse('Missing notification id'), { status: 400 })
        }

        const notificationModel = (prisma as any).notification;
        if (!notificationModel) throw new Error('Model notification unavailable');

        const notification = await notificationModel.update({
            where: { id },
            data: { read: true }
        })

        return NextResponse.json(createSuccessResponse(notification))
    } catch (error: any) {
        console.error('Update notification error:', error)
        return NextResponse.json(createErrorResponse(
            process.env.NODE_ENV === 'development' ? error.message : 'Server error'
        ), { status: 500 })
    }
}
