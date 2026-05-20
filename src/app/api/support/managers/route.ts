import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function GET(request: NextRequest) {
    try {
        const auth = verifyTokenFromRequest(request)
        if (auth?.role !== 'MANAGER' && auth?.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const managers = await prisma.user.findMany({
            where: {
                role: { in: ['MANAGER', 'EMPLOYEE'] },
                isActive: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            },
            orderBy: {
                role: 'asc'
            }
        })

        return NextResponse.json({ success: true, managers })
    } catch (error) {
        console.error('Error fetching managers:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
