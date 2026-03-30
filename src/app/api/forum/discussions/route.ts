import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Helper: Trích xuất Role và ID của người dùng từ token
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

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const categoryId = searchParams.get('categoryId')
        const q = searchParams.get('q') // Từ khóa tìm kiếm
        const sort = searchParams.get('sort') || 'newest' // [newest, trending, unanswered]
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        // Only fetch APPROVED discussions for public view
        const whereClause: any = {
            status: 'APPROVED'
        }
        
        // Lọc theo Category
        if (categoryId) {
            whereClause.categoryId = categoryId
        }
        
        // Tìm kiếm toàn văn
        if (q) {
            whereClause.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { content: { contains: q, mode: 'insensitive' } },
            ]
        }
        
        // Lọc các câu hỏi ế (chưa có người giải đáp)
        if (sort === 'unanswered') {
            whereClause.comments = { none: {} }
        }

        // Sắp xếp
        let orderByClause: any = { createdAt: 'desc' }
        if (sort === 'trending') {
            orderByClause = { views: 'desc' } // Nhiều view nhất
        } else if (sort === 'most_upvoted') {
            orderByClause = { upvotes: 'desc' } // Nhiều upvote nhất
        }

        const [discussions, total] = await Promise.all([
            prisma.discussion.findMany({
                where: whereClause,
                orderBy: orderByClause,
                skip,
                take: limit,
                include: {
                    author: {
                        select: { id: true, name: true, role: true }
                    },
                    category: {
                        select: { id: true, name: true, slug: true, icon: true }
                    },
                    _count: {
                        select: { comments: true }
                    }
                }
            }),
            prisma.discussion.count({ where: whereClause })
        ])

        // Map data để ẩn danh
        const mappedDiscussions = discussions.map(doc => {
            if (doc.isAnonymous) {
                return {
                    ...doc,
                    author: { id: '', name: 'Cư dân ẩn danh', role: 'CUSTOMER' }
                }
            }
            return doc
        })

        return NextResponse.json({
            success: true,
            data: mappedDiscussions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Lỗi khi fetch danh sách câu hỏi forum:', error)
        return NextResponse.json(
            { success: false, error: 'Lỗi máy chủ nội bộ' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = getUserAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Vui lòng đăng nhập để đặt câu hỏi!' }, { status: 401 })
        }

        const body = await request.json()
        const { title, content, categoryId, tags, isAnonymous } = body

        if (!title || !content || !categoryId) {
            return NextResponse.json({ error: 'Dữ liệu không hợp lệ. Thiết Title, Content hoặc Category!' }, { status: 400 })
        }

        // TODO: Gắn AI Auto-Moderator kiểm tra nội dung bẩn ở đây (Lớp 1)
        const badWords = ['địt', 'đm', 'vkl', 'lừa đảo', 'casino', 'đánh bạc', 'sex']
        const lowerTitle = title.toLowerCase()
        const lowerContent = content.toLowerCase()
        const hasBadWords = badWords.some(w => lowerTitle.includes(w) || lowerContent.includes(w))
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

        const discussion = await prisma.discussion.create({
            data: {
                title,
                content,
                categoryId,
                authorId: auth.userId,
                isAnonymous: Boolean(isAnonymous),
                status: initialStatus as any,
                systemFlag: flagMessage,
                tags: tags || [],
            },
            include: {
                author: {
                    select: { id: true, name: true, role: true }
                },
                category: true,
            }
        })

        return NextResponse.json({ success: true, data: discussion }, { status: 201 })
    } catch (error) {
        console.error('Lỗi khi đăng câu hỏi mới:', error)
        return NextResponse.json(
            { success: false, error: 'Lỗi rò rỉ máy chủ khi đăng bài' },
            { status: 500 }
        )
    }
}
