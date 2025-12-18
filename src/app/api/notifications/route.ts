import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// Helper to get real userId from either JWT or headers
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // 1. Try to get from JWT payload (most reliable)
  const payload = verifyTokenFromRequest(request)
  if (payload && payload.userId) {
    return payload.userId
  }

  // 2. Fallback to header (from middleware)
  const userId = request.headers.get('x-user-id')
  return userId
}

// GET /api/notifications - Get all notifications for current user with pagination
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await prisma.notification.count({
      where: { userId }
    })

    // Get from database with pagination
    const dbNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: [
        { read: 'asc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    })

    const all = dbNotifications.map(n => ({
      ...n,
      read: n.read,
      isRead: n.read
    }))

    // Unread count is still global, not paged
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false }
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json(
      createSuccessResponse({
        notifications: all,
        unreadCount: unreadCount,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }, 'Success'),
      { status: 200 }
    )

  } catch (error: any) {
    console.error('[Notifications API] GET Error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// POST /api/notifications - Mark as read (single or all)
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
    }

    const body = await request.json()
    const { notificationId, markAll } = body

    if (markAll) {
      // Mark all unread notifications for this user as read
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          read: false
        },
        data: {
          read: true
        }
      })

      return NextResponse.json(
        createSuccessResponse({}, 'All notifications marked as read'),
        { status: 200 }
      )
    }

    if (!notificationId) {
      return NextResponse.json(
        createErrorResponse('Missing notificationId', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Update single notification
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

  } catch (error: any) {
    console.error('[Notifications API] POST Error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] is handled by a separate route file normally
// but if it's missing, you could handle it here or ensure it exists at src/app/api/notifications/[id]/route.ts
