import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Increment lượt view mỗi khi load trang (Tối ưu thì thả qua Redis)
        await prisma.discussion.update({
            where: { id },
            data: { views: { increment: 1 } }
        })

        const discussion = await prisma.discussion.findUnique({
            where: { id },
            include: {
                author: {
                    select: { id: true, name: true, role: true }
                },
                category: true,
                comments: {
                    orderBy: [
                        { isAccepted: 'desc' }, // Đẩy câu trả lời mác xanh lên Tóp đầu
                        { upvotes: 'desc' },    // Tiếp theo là số lượt Upvote
                        { createdAt: 'asc' }    // Cuối cùng là theo thời gian
                    ],
                    include: {
                        author: {
                            select: { id: true, name: true, role: true } // Lôi Role để biết mà gắn Badge Thầu/Supplier
                        }
                    }
                }
            }
        })

        if (!discussion) {
            return NextResponse.json({ error: 'Bài thảo luận không tồn tại!' }, { status: 404 })
        }

        // Mask author if anonymous
        if (discussion.isAnonymous) {
            discussion.author = { id: '', name: 'Chủ nhà ẩn danh', role: 'CUSTOMER' } as any
        }
        
        // Map comments and mask if anonymous
        discussion.comments = discussion.comments.map(c => {
            if (c.isAnonymous) {
                return { ...c, author: { id: '', name: 'Người dùng ẩn danh', role: 'CUSTOMER' } } as any
            }
            return c
        })

        return NextResponse.json({
            success: true,
            data: discussion
        })

    } catch (error) {
        console.error('Lỗi khi tải chi tiết bài đăng Diễn đàn:', error)
        return NextResponse.json(
            { success: false, error: 'Không thể tả dữ liệu!' },
            { status: 500 }
        )
    }
}
