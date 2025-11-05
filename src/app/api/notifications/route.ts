import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { getAllNotifications } from '@/lib/notification-service'

// GET /api/notifications - Get all notifications
export async function GET(request: NextRequest) {
  try {
    let userId = request.headers.get('x-user-id')
    
    // In development mode, if userId is 'dev-user', find the first admin
    if (process.env.NODE_ENV === 'development' && userId === 'dev-user') {
      const admin = await prisma.user.findFirst({
        where: { role: 'MANAGER' },
        select: { id: true }
      })
      if (admin) {
        userId = admin.id
      }
    }
    
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
        { read: 'asc' },
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
        read: false,
        isRead: false,
        createdAt: new Date(),
        data: n.data || {},
        productId: n.productId,
        productName: n.productName
      })),
      ...dbNotifications.map(n => ({
        ...n,
        read: n.read,
        isRead: n.read
      }))
    ]

    const unreadCount = all.filter(n => !(n as any).read && !(n as any).isRead).length

    return NextResponse.json(
      createSuccessResponse({
        notifications: all,
        unreadCount: unreadCount
      }, 'Success'),
      { status: 200 }
    )

  } catch (error) {
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/notifications/mark-read - Mark as read
export async function POST(request: NextRequest) {
  try {
    let userId = request.headers.get('x-user-id')
    
    // In development mode, if userId is 'dev-user', find the first admin
    if (process.env.NODE_ENV === 'development' && userId === 'dev-user') {
      const admin = await prisma.user.findFirst({
        where: { role: 'MANAGER' },
        select: { id: true }
      })
      if (admin) {
        userId = admin.id
      }
    }
    
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

    // Update - check both id and userId to ensure user owns the notification
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId
      },
      data: {
        read: true
      }
    })

    return NextResponse.json(
      createSuccessResponse({}, 'Marked as read'),
      { status: 200 }
    )

  } catch (error) {
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}
