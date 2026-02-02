import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const supplierId = searchParams.get('supplierId')

    if (!supplierId) {
        return NextResponse.json({ success: false, message: 'Missing supplierId' }, { status: 400 })
    }

    try {
        // Fetch chat messages stored as Notifications
        // We filter by supplierId and metadata.type = 'chat'
        const notifications = await prisma.notification.findMany({
            where: {
                supplierId: supplierId,
                title: 'Chat Message' // Simple filter
            },
            orderBy: { createdAt: 'asc' }
        })

        const messages = notifications.map(n => ({
            id: n.id,
            message: n.message,
            isAdmin: (n.metadata as any)?.isAdmin || false,
            fileUrl: (n.metadata as any)?.fileUrl,
            fileType: (n.metadata as any)?.fileType,
            createdAt: n.createdAt
        }))

        return NextResponse.json(createSuccessResponse({ messages }))
    } catch (error) {
        console.error('Error fetching chat:', error)
        return NextResponse.json({ success: false, message: 'Error fetching messages' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { supplierId, message, fileUrl, fileType } = body

        if (!supplierId || (!message && !fileUrl)) {
            return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 })
        }

        // Create a Notification to represent the message
        const newNotification = await prisma.notification.create({
            data: {
                supplierId: supplierId,
                title: 'Chat Message',
                message: message || (fileUrl ? '[File Attachment]' : ''),
                type: 'INFO',
                metadata: {
                    type: 'chat',
                    isAdmin: false,
                    fileUrl,
                    fileType
                },
                read: true
            }
        })

        const formattedMessage = {
            id: newNotification.id,
            message: newNotification.message,
            isAdmin: false,
            fileUrl: fileUrl,
            fileType: fileType,
            createdAt: newNotification.createdAt
        }

        return NextResponse.json(createSuccessResponse(formattedMessage))
    } catch (error) {
        console.error('Error sending message:', error)
        return NextResponse.json({ success: false, message: 'Error sending message' }, { status: 500 })
    }
}
