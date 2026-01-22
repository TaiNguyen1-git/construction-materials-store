import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, role: true }
        })

        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
        }

        // 1. Find a Support Agent (MUST NOT BE THE CURRENT USER)
        let supportAgent = await prisma.user.findFirst({
            where: {
                role: 'MANAGER',
                id: { not: userId } // Exclude current user
            }
        })

        if (!supportAgent) {
            supportAgent = await prisma.user.findFirst({
                where: {
                    role: 'EMPLOYEE',
                    id: { not: userId }
                }
            })
        }

        // Extreme Fallback for single-user dev environments
        if (!supportAgent) {
            supportAgent = await prisma.user.findFirst({
                where: { id: { not: userId } }
            })
        }

        if (!supportAgent) {
            return NextResponse.json({
                success: false,
                error: 'Không có nhân viên hỗ trợ nào khác khả dụng để chat với bạn.'
            }, { status: 404 })
        }

        // 2. Check if a conversation already exists
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { participant1Id: userId, participant2Id: supportAgent.id },
                    { participant1Id: supportAgent.id, participant2Id: userId }
                ]
            }
        })

        // 3. Create NEW if doesn't exist
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participant1Id: userId,
                    participant1Name: currentUser.name,
                    participant2Id: supportAgent.id,
                    participant2Name: "Hỗ trợ viên: " + supportAgent.name,
                    lastMessage: "Chào bạn, tôi cần hỗ trợ",
                    lastMessageAt: new Date(),
                    unread1: 0,
                    unread2: 1,
                    messages: {
                        create: {
                            senderId: supportAgent.id,
                            senderName: supportAgent.name,
                            content: "Xin chào " + currentUser.name + "! Chúng tôi đã nhận được yêu cầu hỗ trợ của bạn. Nhân viên tư vấn sẽ phản hồi sớm nhất có thể.",
                            isRead: false
                        }
                    }
                }
            })

            // IMPORTANT: Create a SupportRequest record so it shows up in Admin Dashboard
            await prisma.supportRequest.create({
                data: {
                    name: currentUser.name || 'Nhà thầu',
                    phone: 'Liên hệ qua chat',
                    message: `[CHAT TRỰC TIẾP] Nhà thầu ${currentUser.name} đã bắt đầu cuộc hội thoại hỗ trợ. ID: ${conversation.id}`,
                    userId: currentUser.id,
                    status: 'IN_PROGRESS',
                    priority: 'HIGH',
                }
            })
        } else {
            // Ensure there is an active support request if they are chatting
            const existingRequest = await prisma.supportRequest.findFirst({
                where: { userId: currentUser.id, status: { in: ['PENDING', 'IN_PROGRESS'] } }
            })

            if (!existingRequest) {
                await prisma.supportRequest.create({
                    data: {
                        name: currentUser.name || 'Nhà thầu',
                        phone: 'Liên hệ qua chat',
                        message: `[CHAT TRỰC TIẾP] Nhà thầu ${currentUser.name} quay lại hỗ trợ. ID: ${conversation.id}`,
                        userId: currentUser.id,
                        status: 'IN_PROGRESS',
                        priority: 'HIGH',
                    }
                })
            }
        }

        return NextResponse.json({ success: true, conversationId: conversation.id })

    } catch (error: any) {
        console.error('Support chat error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
