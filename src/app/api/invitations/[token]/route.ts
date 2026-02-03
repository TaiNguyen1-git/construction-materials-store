import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params
        const invitation = await prisma.organizationInvitation.findUnique({
            where: { token },
            include: {
                organization: {
                    select: {
                        name: true,
                        logo: true
                    }
                },
                invitedBy: {
                    select: {
                        name: true
                    }
                }
            }
        })

        if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
            return NextResponse.json({ success: false, error: 'Lời mời không hợp lệ hoặc đã hết hạn' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: invitation })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Lỗi máy chủ' }, { status: 500 })
    }
}
