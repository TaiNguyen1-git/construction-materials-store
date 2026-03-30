import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const getUserAuth = (request: NextRequest) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.cookies.get('access_token')?.value
    if (!token) return null
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        return { userId: decoded.userId, role: decoded.role }
    } catch {
        return null
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params // Discussion ID
        const auth = getUserAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }

        const body = await request.json()
        const { commentId } = body

        if (!commentId) {
            return NextResponse.json({ error: 'Thiếu ID của câu trả lời' }, { status: 400 })
        }

        // 1. Phải là Chủ của bài viết (Hoặc Admin) thì mới có Quyền tick xanh!
        const discussion = await prisma.discussion.findUnique({
            where: { id },
            select: { authorId: true }
        })

        if (!discussion) {
            return NextResponse.json({ error: 'Topic không tồn tại' }, { status: 404 })
        }

        if (discussion.authorId !== auth.userId && auth.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Chỉ người hỏi mới có đặc quyền Chấp Nhận câu trả lời!' }, { status: 403 })
        }

        // 2. Transaction: Gỡ xanh tất cả các câu trước + Tick xanh câu mới + Khóa nhẹ Topic
        await prisma.$transaction([
            // Bỏ màu xanh của mọi Comment khác trong Topic
            prisma.comment.updateMany({
                where: { discussionId: id, isAccepted: true },
                data: { isAccepted: false }
            }),
            // Chấm màu Xanh cho Comment được chọn
            prisma.comment.update({
                where: { id: commentId },
                data: { isAccepted: true }
            }),
            // Đóng Mark "Đã Xong" cho Chủ đề
            prisma.discussion.update({
                where: { id },
                data: { isResolved: true }
            })
        ])

        // TƯƠNG LAI: Bắn API cộng "Điểm Chuyên Gia" (+20 Vàng) cho Nhà thầu sỡ hữu `commentId` này

        return NextResponse.json({ success: true, message: 'Đã cập nhật câu trả lời hoàn hảo!' })

    } catch (error) {
        console.error('Lỗi khi chốt câu trả lời đinh:', error)
        return NextResponse.json(
            { success: false, error: 'Xử lý đóng Topic thất bại' },
            { status: 500 }
        )
    }
}
