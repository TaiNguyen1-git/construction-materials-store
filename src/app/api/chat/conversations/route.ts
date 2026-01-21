import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const decoded = await verifyTokenFromRequest(req)
        if (!decoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const userId = decoded.userId

        // Find conversations where the user is either participant 1 or 2
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { participant1Id: userId },
                    { participant2Id: userId }
                ]
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            data: conversations
        })

    } catch (error: any) {
        console.error('[CONVERSATIONS_GET]', error)
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
