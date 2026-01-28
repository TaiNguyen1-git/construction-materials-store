import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email-service'
import { checkRateLimit } from '@/lib/rate-limit-api'
import crypto from 'crypto'

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
    try {
        // 🛡️ SECURITY: Rate limit to prevent abuse (3 requests per 15 minutes per IP)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown'

        const rateLimitResult = await checkRateLimit(`forgot-password:${ip}`, 'STRICT')
        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
                },
                { status: 429 }
            )
        }

        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            )
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        })

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'
            })
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        // Save token to user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: resetTokenHash,
                resetTokenExpiry
            }
        })

        // Generate reset link
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`

        // Send email
        const emailSent = await EmailService.sendPasswordReset({
            email: user.email,
            name: user.name || 'Khách hàng',
            resetLink
        })

        if (!emailSent) {
            console.error('Failed to send password reset email to:', email)
        }

        return NextResponse.json({
            success: true,
            message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'
        })

    } catch (error: unknown) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
