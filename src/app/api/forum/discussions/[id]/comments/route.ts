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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params // id là ID của bài Thảo luận (Discussion)
        const auth = getUserAuth(request)
        
        if (!auth) {
            return NextResponse.json({ error: 'Đăng nhập để phản hồi chuyên gia!' }, { status: 401 })
        }

        const body = await request.json()
        const { content, isAnonymous } = body

        if (!content || content.trim() === '') {
            return NextResponse.json({ error: 'Nội dung bình luận quá ngắn!' }, { status: 400 })
        }

        // TODO: AI Quét Nội dung ở đây tự bắt Link Bán hàng (Cross-sell) Lớp 1
        const badWords = ['địt', 'đm', 'vkl', 'lừa đảo', 'casino', 'đánh bạc', 'sex']
        const hasBadWords = badWords.some(w => content.toLowerCase().includes(w))
        const numLinks = (content.match(/https?:\/\//g) || []).length
        
        let initialStatus = 'APPROVED'
        let flagMessage = null

        if (hasBadWords) {
            initialStatus = 'PENDING_REVIEW'
            flagMessage = 'Vi phạm từ vựng (Auto-Mod)'
        } else if (numLinks >= 2) {
            initialStatus = 'PENDING_REVIEW'
            flagMessage = 'Có dấu hiệu rải Link Spam (Auto-Mod)'
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                discussionId: id,
                authorId: auth.userId,
                isAnonymous: Boolean(isAnonymous),
                status: initialStatus as any,
                systemFlag: flagMessage
            },
            include: {
                author: {
                    select: { id: true, name: true, role: true }
                }
            }
        })

        return NextResponse.json({ success: true, data: comment }, { status: 201 })

    } catch (error) {
        console.error('Lỗi khi gửi bình luận:', error)
        return NextResponse.json(
            { success: false, error: 'Bình luận thất bại do lỗi hệ thống' },
            { status: 500 }
        )
    }
}
