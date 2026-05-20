import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const decoded = await verifyTokenFromRequest(request)
        if (!decoded?.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const users = await prisma.user.findMany({
            where: {
                isActive: true,
                id: { not: decoded.userId } // Exclude current user
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            },
            orderBy: {
                name: 'asc'
            }
        })

        // Group by role for the frontend
        const staff = users.filter(u => u.role === 'MANAGER' || u.role === 'EMPLOYEE')
        const contractors = users.filter(u => u.role === 'CONTRACTOR')
        const customers = users.filter(u => u.role === 'CUSTOMER')
        const suppliers = users.filter(u => u.role === 'SUPPLIER')

        return NextResponse.json({
            success: true,
            data: {
                staff,
                contractors,
                customers,
                suppliers
            }
        })

    } catch (error: any) {
        console.error('[CHAT_PARTICIPANTS_GET]', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
