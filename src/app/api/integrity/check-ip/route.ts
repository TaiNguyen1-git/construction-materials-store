import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const ip = request.nextUrl.searchParams.get('ip')
    
    if (!ip) return NextResponse.json({ restricted: false })
    
    try {
        // Kiểm tra xem IP này có lệnh IP_BAN nào đang hoạt động không
        const activeRestriction = await prisma.userRestriction.findFirst({
            where: {
                AND: [
                    {
                        OR: [
                            { ipAddress: ip },
                            { guestId: ip } 
                        ]
                    },
                    { type: 'IP_BAN' as any },
                    { isActive: true },
                    {
                        OR: [
                            { endDate: null },
                            { endDate: { gt: new Date() } }
                        ]
                    }
                ]
            }
        })

        return NextResponse.json({ 
            restricted: !!activeRestriction,
            reason: activeRestriction?.reason || null,
            type: activeRestriction?.type || null,
            endDate: activeRestriction?.endDate || null
        })
    } catch (error) {
        console.error('IP Check error:', error)
        return NextResponse.json({ restricted: false })
    }
}
