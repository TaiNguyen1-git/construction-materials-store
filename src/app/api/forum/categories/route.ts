import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const categories = await prisma.forumCategory.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { discussions: true }
                }
            }
        })
        return NextResponse.json({ success: true, data: categories })
    } catch (error) {
        console.error('Lỗi khi lấy danh mục diễn đàn:', error)
        return NextResponse.json(
            { success: false, error: 'Không thể lấy danh mục diễn đàn' },
            { status: 500 }
        )
    }
}
