import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'

async function getAdminUser(request: any) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.cookies?.get('access_token')?.value ||
        (await headers()).get('authorization')?.replace('Bearer ', '')

    if (!token) return null

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string }
        if (decoded.role !== 'ADMIN' && decoded.role !== 'MANAGER' && decoded.role !== 'EMPLOYEE') {
            return null
        }
        return decoded
    } catch {
        return null
    }
}

export async function GET(request: any) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || undefined
        const keyword = searchParams.get('keyword') || ''

        const whereClause: any = {}
        if (status && status !== 'ALL') {
             whereClause.status = status
        }
        if (keyword) {
             whereClause.OR = [
                 { title: { contains: keyword, mode: 'insensitive' } },
                 { content: { contains: keyword, mode: 'insensitive' } },
                 { systemFlag: { contains: keyword, mode: 'insensitive' } }
             ]
        }

        const [discussions, total] = await Promise.all([
            prisma.discussion.findMany({
                where: whereClause,
                include: {
                    author: { select: { id: true, name: true, email: true, role: true } },
                    category: { select: { name: true } },
                    _count: { select: { comments: true } }
                },
                orderBy: [
                    { status: 'desc' }, // PENDING_REVIEW lên trước
                    { createdAt: 'desc' }
                ],
                take: 50
            }),
            prisma.discussion.count({ where: whereClause })
        ])

        // Thống kê nhanh
        const stats = await prisma.discussion.groupBy({
             by: ['status'],
             _count: true
        })

        return NextResponse.json({
            success: true,
            data: discussions,
            stats,
            total
        })

    } catch (error) {
        console.error('Lỗi khi fetch queue forum:', error)
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
    }
}

export async function PUT(request: any) {
    try {
        const admin = await getAdminUser(request)
        if (!admin) {
            return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
        }

        const body = await request.json()
        const { discussionId, action } = body // action: 'APPROVE', 'REJECT', 'DELETE'

        if (!discussionId || !action) {
             return NextResponse.json({ error: 'Thiếu tham số' }, { status: 400 })
        }

        if (action === 'DELETE') {
             await prisma.discussion.delete({ where: { id: discussionId } })
             return NextResponse.json({ success: true, message: 'Đã xóa bài viết vĩnh viễn' })
        }

        const updated = await prisma.discussion.update({
             where: { id: discussionId },
             data: { status: action }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error('Lỗi duyệt bài:', error)
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
    }
}
