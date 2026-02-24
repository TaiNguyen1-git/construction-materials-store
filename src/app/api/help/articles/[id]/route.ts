import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const { type } = await req.json() // 'yes' or 'no'

        if (type === 'yes') {
            await (prisma as any).helpArticle.update({
                where: { id },
                data: { helpfulYes: { increment: 1 } }
            })
        } else {
            await (prisma as any).helpArticle.update({
                where: { id },
                data: { helpfulNo: { increment: 1 } }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
