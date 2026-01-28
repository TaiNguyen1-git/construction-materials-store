import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { logger, logAuth, logAPI } from '@/lib/logger'

// Helper to hash token for storage
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

// Helper to get client info
function getClientInfo(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'Unknown'
    const tabId = request.headers.get('x-tab-id') || null

    let deviceInfo = 'Unknown Device'
    if (userAgent.includes('Mobile')) {
        deviceInfo = 'Điện thoại'
    } else if (userAgent.includes('Windows')) {
        deviceInfo = 'Windows PC'
    } else if (userAgent.includes('Mac')) {
        deviceInfo = 'Mac'
    }

    if (userAgent.includes('Chrome')) {
        deviceInfo += ' - Chrome'
    } else if (userAgent.includes('Firefox')) {
        deviceInfo += ' - Firefox'
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        deviceInfo += ' - Safari'
    }

    return { userAgent, ip, tabId, deviceInfo }
}

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        const { otp, verificationToken, type } = await request.json()

        if (!otp || !verificationToken) {
            return NextResponse.json(
                { success: false, error: 'Thiếu mã xác thực hoặc token' },
                { status: 400 }
            )
        }

        // Verify verification token
        let decoded: any
        try {
            decoded = jwt.verify(verificationToken, process.env.JWT_SECRET!)
        } catch (err) {
            return NextResponse.json(
                { success: false, error: 'Phiên xác thực đã hết hạn. Vui lòng thử lại.' },
                { status: 401 }
            )
        }

        const userId = decoded.userId
        const purpose = decoded.purpose

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Người dùng không tồn tại' },
                { status: 404 }
            )
        }

        // Check OTP
        if (!user.otpCode || user.otpCode !== otp) {
            return NextResponse.json(
                { success: false, error: 'Mã xác thực không chính xác' },
                { status: 400 }
            )
        }

        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Mã xác thực đã hết hạn' },
                { status: 400 }
            )
        }

        // Success - Clear OTP and update user
        const updateData: any = {
            otpCode: null,
            otpExpiresAt: null
        }

        if (purpose === 'email_verification') {
            updateData.emailVerified = true
        } else if (purpose === '2fa') {
            // Just clearing OTP is enough for 2FA
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        })

        // Generate NEW token pair using AuthService
        const { accessToken, refreshToken } = AuthService.generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.role as any
        })

        const clientInfo = getClientInfo(request)
        const tokenHash = hashToken(accessToken)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        const session = await prisma.userSession.create({
            data: {
                userId: user.id,
                tokenHash,
                deviceInfo: clientInfo.deviceInfo,
                ipAddress: clientInfo.ip,
                userAgent: clientInfo.userAgent,
                tabId: clientInfo.tabId,
                expiresAt,
                lastActivityAt: new Date(),
            }
        })

        logAuth.login(user.id, user.email, true)

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user as any

        const duration = Date.now() - startTime
        logAPI.response('POST', '/api/verify-otp', 200, duration)

        const response = NextResponse.json({
            success: true,
            user: userWithoutPassword,
            sessionId: session.id,
            needs2FASetupPrompt: !(user as any).hasSetTwoFactor,
        }, { status: 200 })

        // Use AuthService helper to set cookies
        AuthService.setAuthCookies(response, accessToken, refreshToken)

        return response

    } catch (error: any) {
        console.error('Verify OTP error:', error)
        return NextResponse.json(
            { success: false, error: 'Lỗi hệ thống' },
            { status: 500 }
        )
    }
}
