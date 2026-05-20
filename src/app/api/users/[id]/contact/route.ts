import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params
        const decoded = await verifyTokenFromRequest(request)
        if (!decoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // 🛡️ Robust check for Guest users vs Real users
        const isGuestId = userId && userId.startsWith('guest_')
        const isValidObjectId = userId && /^[a-f\d]{24}$/i.test(userId)

        if (isGuestId) {
            // Logic for guest info retrieval
            // Since guests don't have a record in the 'User' table, 
            // we find their name and possibly phone from their conversations/messages
            
            // 1. Find a conversation involving this guest to get their name
            const conversation = await prisma.conversation.findFirst({
                where: {
                    OR: [
                        { participant1Id: userId },
                        { participant2Id: userId }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            })

            if (!conversation) {
                return NextResponse.json({ message: 'Guest info not found' }, { status: 404 })
            }

            const guestName = conversation.participant1Id === userId 
                ? conversation.participant1Name 
                : conversation.participant2Name

            // 2. Try to find the phone number from the messages (if any)
            // Contractors often receive guest phone info in the first automated message
            const firstMessage = await prisma.message.findFirst({
                where: { conversationId: conversation.id, senderId: userId },
                orderBy: { createdAt: 'asc' }
            })

            let guestPhone = 'Chưa cập nhật'
            let guestEmail = 'Khách không dùng email'

            if (firstMessage?.content) {
                // Look for patterns like "SĐT liên hệ: 090xxx" or "SĐT: 090xxx"
                const phoneMatch = firstMessage.content.match(/(?:SĐT(?: liên hệ)?:\s*)([\d\s\.\-]+)/i)
                if (phoneMatch) {
                    guestPhone = phoneMatch[1].trim()
                }
            }

            // 3. Fallback: Search in Leads table by name if phone still missing
            if (guestPhone === 'Chưa cập nhật' && guestName) {
                const lead = await prisma.lead.findFirst({
                    where: { name: guestName },
                    orderBy: { createdAt: 'desc' }
                })
                if (lead) {
                    if (lead.phone) guestPhone = lead.phone
                    if (lead.email) guestEmail = lead.email
                }
            }

            return NextResponse.json({
                success: true,
                data: {
                    id: userId,
                    name: guestName || 'Khách vãng lai',
                    email: guestEmail,
                    phone: guestPhone,
                    role: 'GUEST',
                    createdAt: conversation.createdAt
                }
            })
        }

        if (!isValidObjectId) {
            return NextResponse.json({ message: 'User not found (Invalid ID format)' }, { status: 404 })
        }

        // Find user and their basic contact info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true
            }
        })

        if (!user) {
            const supplier = await prisma.supplier.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    createdAt: true
                }
            })

            if (supplier) {
                return NextResponse.json({
                    success: true,
                    data: {
                        ...supplier,
                        role: 'SUPPLIER'
                    }
                })
            }

            return NextResponse.json({ message: 'User/Supplier not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: user
        })

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
        console.error('[USER_CONTACT_GET]', error)
        return NextResponse.json({ message: errorMessage }, { status: 500 })
    }
}
