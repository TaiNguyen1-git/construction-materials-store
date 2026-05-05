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
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
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
