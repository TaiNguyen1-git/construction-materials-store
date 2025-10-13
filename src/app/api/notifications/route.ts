import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { getAllNotifications } from '@/lib/notification-service'

// GET /api/notifications - Get all notifications
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    // Get from database
    const dbNotifications = await prisma.notification.findMany({
      where: {
        userId
      },
      orderBy: [
        { isRead: 'asc' },
        { createdAt: 'desc' }
      ],
      take: 50
    })

    // Get real-time notifications
    const realtimeNotifications = await getAllNotifications()

    // Combine
    const all = [
      ...realtimeNotifications.map(n => ({
        id: `realtime-${Date.now()}-${Math.random()}`,
        type: n.type,
        title: n.title,
        message: n.message,
        priority: n.priority,
        isRead: false,
        createdAt: new Date(),
        data: n.data || {},
        productId: n.productId,
        productName: n.productName
      })),
      ...dbNotifications
    ]

    return NextResponse.json(
      createSuccessResponse({
        notifications: all,
        unreadCount: all.filter(n => !n.isRead).length
      }, 'Success'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/notifications/mark-read - Mark as read
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        createErrorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        createErrorResponse('Missing notificationId', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Update
    await prisma.notification.update({
      where: {
        id: notificationId,
        userId
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json(
      createSuccessResponse({}, 'Marked as read'),
      { status: 200 }
    )

  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
