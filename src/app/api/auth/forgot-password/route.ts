import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email-service'
import crypto from 'crypto'

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
    try {
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
            console.log('Password reset requested for non-existent email:', email)
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

    } catch (error: any) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
