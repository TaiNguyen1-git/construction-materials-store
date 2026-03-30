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

export async function POST(request: NextRequest) {
    try {
        const auth = getUserAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Đăng nhập để vinh danh chuyên gia!' }, { status: 401 })
        }

        const body = await request.json()
        const { targetId, targetType, value } = body 
        // targetType: "DISCUSSION" hoặc "COMMENT"
        // value: 1 (Upvote), -1 (Downvote), 0 (Hủy Vote)

        if (!targetId || !targetType || typeof value !== 'number') {
            return NextResponse.json({ error: 'Dữ liệu không hoàn chỉnh' }, { status: 400 })
        }

        // Check xem đã vote bao giờ chưa
        const existingVote = await prisma.voteRecord.findUnique({
            where: {
                userId_targetId_targetType: {
                    userId: auth.userId,
                    targetId,
                    targetType
                }
            }
        })

        let diff = value // Số điểm thay đổi (+1, -1, hay +2)

        if (existingVote) {
             diff = value - existingVote.value
            if (value === 0) {
                 await prisma.voteRecord.delete({ where: { id: existingVote.id } })
            } else {
                 await prisma.voteRecord.update({
                     where: { id: existingVote.id },
                     data: { value }
                 })
            }
        } else if (value !== 0) { // Chưa từng vote
             await prisma.voteRecord.create({
                 data: {
                     userId: auth.userId,
                     targetId,
                     targetType,
                     value
                 }
             })
        }

        // Áp dụng số điểm thay đổi vào Bảng gốc (Discussion hoặc Comment)
        if (targetType === 'DISCUSSION') {
              await prisma.discussion.update({
                  where: { id: targetId },
                  data: { upvotes: { increment: diff } } // auto +-
              })
        } else if (targetType === 'COMMENT') {
              await prisma.comment.update({
                  where: { id: targetId },
                  data: { upvotes: { increment: diff } }
              })
        }

         // TƯƠNG LAI: Cập nhật "Điểm Chuyên Gia" cho chủ bài viết / bình luận đó

        return NextResponse.json({ success: true, message: 'Đã bình chọn', diff })

    } catch (error) {
        console.error('Lỗi khi cày cuốc vote:', error)
        return NextResponse.json(
            { success: false, error: 'Chấm điểm thăng hoa bị từ chối' },
            { status: 500 }
        )
    }
}
