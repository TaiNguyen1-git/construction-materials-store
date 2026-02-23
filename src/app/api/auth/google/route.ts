import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService, UserRole } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { logger, logAuth, logAPI } from '@/lib/logger'
import crypto from 'crypto'

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

    // Parse user agent for device info
    let deviceInfo = 'Unknown Device'
    if (userAgent.includes('Mobile')) {
        deviceInfo = 'Điện thoại'
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
        deviceInfo = 'Máy tính bảng'
    } else if (userAgent.includes('Windows')) {
        deviceInfo = 'Windows PC'
    } else if (userAgent.includes('Mac')) {
        deviceInfo = 'Mac'
    } else if (userAgent.includes('Linux')) {
        deviceInfo = 'Linux'
    }
    return { userAgent, ip, tabId, deviceInfo }
}

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        const body = await request.json()
        const { access_token } = body

        if (!access_token) {
            return NextResponse.json({ success: false, error: 'Access token is required' }, { status: 400 })
        }

        // 1. Verify token and get user info from Google
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        })

        if (!googleRes.ok) {
            logAuth.failed('google-oauth', 'Invalid Google token')
            return NextResponse.json({ success: false, error: 'Invalid Google token' }, { status: 401 })
        }

        const googleUser = await googleRes.json()
        const { email, name } = googleUser

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email not provided by Google' }, { status: 400 })
        }

        // 2. Find or create user in database
        let user = await prisma.user.findUnique({
            where: { email }
        })

        const userAlreadyExists = !!user

        if (!user) {
            try {
                const salt = await bcrypt.genSalt(10)
                const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), salt)

                // Generate unique referral code for customer
                const referralCode = 'REF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()

                user = await prisma.user.create({
                    data: {
                        email,
                        name: name || email.split('@')[0],
                        password: randomPassword,
                        role: 'CUSTOMER',
                        isActive: true,
                        customer: {
                            create: {
                                customerType: 'REGULAR',
                                loyaltyPoints: 0,
                                totalPurchases: 0,
                                referralCode: referralCode
                            }
                        }
                    }
                })
            } catch (dbError: unknown) {
                const errMsg = dbError instanceof Error ? dbError.message : 'Unknown error'
                logger.error('Google login - DB error', { error: errMsg })
                return NextResponse.json({ success: false, error: 'Database creation failed' }, { status: 500 })
            }

            logger.info('New user created via Google login', { email: user.email })
        }

        // 3. Generate Token Pair using AuthService
        const { accessToken, refreshToken } = AuthService.generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.role as UserRole
        })

        // Log successful login
        logAuth.login(user.id, user.email, true)

        // 🛡️ SESSION MANAGEMENT: Create session record in database
        const clientInfo = getClientInfo(request)
        const tokenHash = hashToken(accessToken)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        await prisma.userSession.create({
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

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user

        const duration = Date.now() - startTime
        logAPI.response('POST', '/api/auth/google', 200, duration)

        const response = NextResponse.json({
            success: true,
            user: userWithoutPassword,
            isOnboardingRequired: !userAlreadyExists
        })

        // Set HTTP-only cookies (with role for portal-specific cookie)
        AuthService.setAuthCookies(response, accessToken, refreshToken, user.role as UserRole)

        return response

    } catch (error: unknown) {
        const duration = Date.now() - startTime
        const err = error instanceof Error ? error : new Error('Unknown error')
        logger.error('Google login error', { error: err.message })
        logAPI.error('POST', '/api/auth/google', err, { duration })

        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
