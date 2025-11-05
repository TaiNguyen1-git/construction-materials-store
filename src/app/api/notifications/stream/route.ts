import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllNotifications } from '@/lib/notification-service'

/**
 * Server-Sent Events (SSE) endpoint for real-time notifications
 * Client connects to this endpoint and receives push notifications instantly
 */
export async function GET(request: NextRequest) {
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
    return new Response('Unauthorized', { status: 401 })
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      // Helper function to send SSE data
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch (error) {
          console.error('Error sending SSE data:', error)
        }
      }

      // Send initial connection message
      send(JSON.stringify({ 
        type: 'connected', 
        message: 'SSE connection established',
        timestamp: new Date().toISOString()
      }))

      // Function to fetch and send notifications
      const sendNotifications = async () => {
        try {
          // Get database notifications
          const dbNotifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: [
              { read: 'asc' },
              { createdAt: 'desc' }
            ],
            take: 50
          })

          // Get real-time notifications (low stock, AI alerts, etc.)
          const realtimeNotifications = await getAllNotifications()

          // Combine notifications
          const all = [
            ...realtimeNotifications.map(n => ({
              id: `realtime-${Date.now()}-${Math.random()}`,
              type: n.type,
              title: n.title,
              message: n.message,
              priority: n.priority,
              read: false,
              isRead: false, // For frontend compatibility
              createdAt: new Date().toISOString(),
              data: n.data || {},
              productId: n.productId,
              productName: n.productName
            })),
            ...dbNotifications.map(n => ({
              id: n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              priority: n.priority,
              read: n.read,
              isRead: n.read, // For frontend compatibility
              createdAt: n.createdAt.toISOString(),
              data: n.metadata || {}
            }))
          ]

          // Send notifications update
          send(JSON.stringify({
            type: 'notifications',
            data: {
              notifications: all,
              unreadCount: all.filter(n => !(n as any).read && !(n as any).isRead).length
            }
          }))
        } catch (error) {
          console.error('Error sending notifications via SSE:', error)
          send(JSON.stringify({ 
            type: 'error', 
            message: 'Failed to fetch notifications' 
          }))
        }
      }

      // Send initial notifications
      await sendNotifications()

      // Poll for new notifications every 5 seconds (faster than regular polling)
      const interval = setInterval(async () => {
        try {
          await sendNotifications()
        } catch (error) {
          console.error('Error in SSE polling:', error)
        }
      }, 5000)

      // Keep connection alive with heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        send(JSON.stringify({ 
          type: 'ping', 
          timestamp: Date.now() 
        }))
      }, 30000)

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        clearInterval(heartbeat)
        try {
          controller.close()
        } catch (error) {
          // Ignore close errors
        }
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}

