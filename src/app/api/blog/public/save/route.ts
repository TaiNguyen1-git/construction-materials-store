import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import EmailService from '@/lib/email/email-service'
import { getUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { email, name, postTitle, postUrl } = await req.json()
        
        if (!email || !postTitle || !postUrl) {
            return NextResponse.json({ success: false, message: 'Missing information' }, { status: 400 })
        }

        // Try to identify the user if logged in
        const session = await getUser()
        const userId = session?.userId

        // 1. If logged in, save to the database
        if (userId) {
            // Find the post ID by URL/slug
            const slug = postUrl.split('/').pop()?.split('?')[0]
            if (slug) {
                const post = await prisma.blogPost.findUnique({ where: { slug } })
                if (post) {
                    await prisma.savedPost.upsert({
                        where: {
                            userId_postId: {
                                userId: userId,
                                postId: post.id
                            }
                        },
                        update: {}, // No need to update anything if it exists
                        create: {
                            userId: userId,
                            postId: post.id
                        }
                    })
                }
            }
        }

        // 2. Clear to send email (for both User and Guest)
        const emailSent = await EmailService.sendSavedPostLink({
            email,
            name: name || 'Bạn',
            postTitle,
            postUrl
        })

        if (!emailSent) {
            console.error('Failed to send save-post email')
            // We don't fail the whole request because the DB save might have succeeded
        }

        return NextResponse.json({ 
            success: true, 
            message: userId ? 'Đã lưu vào tài khoản và gửi email!' : 'Đã gửi link bài viết về email!' 
        })

    } catch (error) {
        console.error('Error in blog/save API:', error)
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { postId } = await req.json()
        const session = await getUser()
        const userId = session?.userId

        if (!userId || !postId) {
            return NextResponse.json({ success: false, message: 'Unauthorized or missing data' }, { status: 400 })
        }

        await prisma.savedPost.delete({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        })

        return NextResponse.json({ success: true, message: 'Đã bỏ lưu bài viết' })
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
    }
}
