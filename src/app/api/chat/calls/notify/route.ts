import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import webpush from '@/lib/webpush'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { recipientId, callerName, type, conversationId } = body

        if (!recipientId || !callerName) {
            return NextResponse.json(createErrorResponse('Missing recipientId or callerName', 'BAD_REQUEST'), { status: 400 })
        }

        // 1. Find all push subscriptions for the recipient
        const subscriptions = await prisma.userPushSubscription.findMany({
            where: { userId: recipientId }
        })

        if (subscriptions.length === 0) {
            return NextResponse.json(createSuccessResponse({ sent: false, reason: 'No subscriptions found' }))
        }

        // 2. Prepare payload
        const payload = JSON.stringify({
            title: `📞 Cuộc gọi ${type === 'video' ? 'video' : 'âm thanh'} từ ${callerName}`,
            body: 'Nhấn để trả lời ngay',
            icon: '/images/smartbuild_bot.png',
            url: `/delivery/call?id=${conversationId}&caller=${encodeURIComponent(callerName)}`, // Temporary landing page or just the app
            tag: `call_${recipientId}`, // Same tag for all call notifications from this caller to avoid clutter
            renotify: true,
            data: {
                type: 'INCOMING_CALL',
                callerName,
                callType: type,
                conversationId,
                recipientId
            }
        })

        // 3. Send notifications
        const pushPromises = subscriptions.map(sub => 
            webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: sub.keys as any
                },
                payload
            ).catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription has expired or is no longer valid
                    return prisma.userPushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
                }
                console.error('Push notification failed:', err)
            })
        )

        await Promise.all(pushPromises)

        return NextResponse.json(createSuccessResponse({ sent: true, count: subscriptions.length }))

    } catch (error) {
        console.error('Call notification error:', error)
        return NextResponse.json(createErrorResponse('Internal server error', 'SERVER_ERROR'), { status: 500 })
    }
}
