import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest, getUserIdFromRequest } from '@/lib/auth-middleware-api'
import { CacheService } from '@/lib/cache'

// GET /api/notifications - Get all notifications for current user with pagination
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    console.log('[Notifications API] GET request:', { 
      userId, 
      url: request.url,
      searchParams: Object.fromEntries(new URL(request.url).searchParams) 
    })

    if (!userId) {
      // For guests or unauthenticated users, return empty list instead of 401
      // This prevents console errors when polling happens on public pages
      return NextResponse.json(
        createSuccessResponse({
          notifications: [],
          unreadCount: 0,
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        }, 'Success'),
        { status: 200 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { userId }
    if (unreadOnly) {
      where.read = false
    }

    // Get total count for pagination
    const totalCount = await prisma.notification.count({
      where
    })

    // Get from database with pagination
    const dbNotifications = await prisma.notification.findMany({
      where,
      orderBy: [
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

    // Get fresh unread count
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
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )

  } catch (error: any) {
    console.error('[Notifications API] GET Error:', error)
    return NextResponse.json(
      createErrorResponse(error.message || 'Internal server error', 'INTERNAL_ERROR'),
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
    // Check if notificationId is a valid MongoDB ObjectId (24 char hex)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(notificationId)
    
    if (!isValidObjectId) {
      return NextResponse.json(
        createSuccessResponse({}, 'Notification not found or invalid ID format'),
        { status: 200 }
      )
    }

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
