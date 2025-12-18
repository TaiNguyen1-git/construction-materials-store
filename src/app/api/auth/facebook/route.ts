import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

        // 3. Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        )

        // Log successful login
        logAuth.login(user.id, user.email, true)

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user

        const duration = Date.now() - startTime
        logAPI.response('POST', '/api/auth/facebook', 200, duration)

        const response = NextResponse.json({
            success: true,
            user: userWithoutPassword,
            token
        })

        // Set HTTP-only cookie for middleware protection
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        })

        return response

    } catch (error: any) {
        const duration = Date.now() - startTime
        logAPI.error('POST', '/api/auth/facebook', error, { duration })
        logger.error('Facebook login error', { error: error.message, stack: error.stack })

        return NextResponse.json(
            { success: false, error: 'Internal server error during Facebook login' },
            { status: 500 }
        )
    }
}
