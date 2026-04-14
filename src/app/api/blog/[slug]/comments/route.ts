import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
    try {
        const { slug } = params
        const post = await prisma.blogPost.findUnique({
            where: { slug },
            select: { id: true }
        })
        
        if (!post) return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 })

        const comments = await prisma.blogComment.findMany({
            where: { postId: post.id, isApproved: true },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: comments })
    } catch (error) {
        console.error('Fetch comments error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
    try {
        const { slug } = params
        const { name, email, content } = await req.json()

        if (!name || !content) {
            return NextResponse.json({ success: false, message: 'Tên và nội dung không được để trống' }, { status: 400 })
        }

        const post = await prisma.blogPost.findUnique({
            where: { slug },
            select: { id: true }
        })

        if (!post) return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 })

        const newComment = await prisma.blogComment.create({
            data: {
                postId: post.id,
                name,
                email,
                content,
                isApproved: true // Auto-approve for now, can be changed to false for moderation
            }
        })

        return NextResponse.json({ success: true, data: newComment })
    } catch (error) {
        console.error('Submit comment error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}
