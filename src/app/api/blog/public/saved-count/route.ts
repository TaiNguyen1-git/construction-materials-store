import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getUser()
        if (!session?.userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const count = await prisma.savedPost.count({
            where: { userId: session.userId }
        })

        return NextResponse.json({ success: true, count })
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
    }
}
