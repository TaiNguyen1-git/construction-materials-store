import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * Admin API to send notifications to users
 * POST /api/admin/notifications
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, title, message, type, priority, metadata } = body

        if (!userId || !title || !message) {
            return NextResponse.json(
                createErrorResponse('Missing required fields', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type: type || 'WARNING',
                priority: priority || 'HIGH',
                metadata: metadata || {}
            }
        })

        return NextResponse.json(
            createSuccessResponse(notification, 'Notification sent successfully'),
            { status: 201 }
        )

    } catch (error) {
        console.error('Admin notification error:', error)
        return NextResponse.json(
            createErrorResponse('Failed to send notification', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
