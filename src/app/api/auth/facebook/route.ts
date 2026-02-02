import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService, UserRole } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { logger, logAuth, logAPI } from '@/lib/logger'

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        const { accessToken } = await request.json()

        if (!accessToken) {
            return NextResponse.json({ success: false, error: 'Access token is required' }, { status: 400 })
        }

        // 1. Verify token and get user info from Facebook Graph API
        const fbRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`)

        if (!fbRes.ok) {
            logAuth.failed('facebook-oauth', 'Invalid Facebook token')
            return NextResponse.json({ success: false, error: 'Invalid Facebook token' }, { status: 401 })
        }

        const fbUser = await fbRes.json()
        const { email, name, id: fbId } = fbUser

        // Note: Some Facebook accounts don't have email addresses (e.g. phone-only accounts)
        // In that case we can use fbId@facebook.com as a fallback
        const userEmail = email || `${fbId}@facebook.com`

        // 2. Find or create user in database
        let user = await prisma.user.findUnique({
            where: { email: userEmail }
        })

        if (!user) {
            // Create new user if doesn't exist
            const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10)

            // Generate unique referral code for customer
            const referralCode = 'REF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()

            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    name: name || userEmail.split('@')[0],
                    password: randomPassword,
                    role: 'CUSTOMER',
                    isActive: true,
                    customer: {
                        create: {
                            customerType: 'REGULAR',
                            loyaltyPoints: 0,
                            referralCode: referralCode
                        }
                    }
                }
            })
            logger.info('New user created via Facebook login', { userId: user.id, email: user.email })
        }

        // 3. Generate Token Pair using AuthService
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = AuthService.generateTokenPair({
            userId: user.id,
            email: user.email,
            role: user.role as UserRole
        })

        // Log successful login
        logAuth.login(user.id, user.email, true)

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user

        const duration = Date.now() - startTime
        logAPI.response('POST', '/api/auth/facebook', 200, duration)

        const response = NextResponse.json({
            success: true,
            user: userWithoutPassword
        })

        // Set HTTP-only cookies (with role for portal-specific cookie)
        AuthService.setAuthCookies(response, newAccessToken, newRefreshToken, user.role as UserRole)

        return response

    } catch (error: unknown) {
        const duration = Date.now() - startTime
        const err = error instanceof Error ? error : new Error('Unknown error')
        logAPI.error('POST', '/api/auth/facebook', err, { duration })
        logger.error('Facebook login error', { error: err.message, stack: err.stack })

        return NextResponse.json(
            { success: false, error: 'Internal server error during Facebook login' },
            { status: 500 }
        )
    }
}
