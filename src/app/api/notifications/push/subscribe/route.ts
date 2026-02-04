import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        // Only read admin_token cookie for this endpoint (Push notifications are for admins only)
        const adminToken = req.cookies.get('admin_token')?.value

        if (!adminToken) {
            console.log('[PUSH_SUBSCRIBE] No admin_token cookie found')
            return NextResponse.json({ message: 'Unauthorized - Admin login required' }, { status: 401 })
        }

        let decoded: any
        try {
            decoded = AuthService.verifyAccessToken(adminToken)
        } catch (err) {
            console.log('[PUSH_SUBSCRIBE] Invalid admin token')
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
        }

        // Debug log to see what's in the decoded token
        console.log('[PUSH_SUBSCRIBE] Decoded admin token:', JSON.stringify(decoded))

        if (!decoded || !decoded.userId) {
            console.log('[PUSH_SUBSCRIBE] Unauthorized - no userId in admin token')
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const userId = decoded.userId
        const subscription = await req.json()

        // Validate subscription object
        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ message: 'Invalid subscription' }, { status: 400 })
        }

        console.log('[PUSH_SUBSCRIBE] Saving subscription for user:', userId)

        // Check if subscription already exists
        const existing = await prisma.userPushSubscription.findUnique({
            where: { endpoint: subscription.endpoint }
        })

        if (existing) {
            // Update existing subscription
            await prisma.userPushSubscription.update({
                where: { endpoint: subscription.endpoint },
                data: {
                    keys: subscription.keys,
                    updatedAt: new Date()
                }
            })
        } else {
            // Create new subscription using connect for the relation
            await prisma.userPushSubscription.create({
                data: {
                    endpoint: subscription.endpoint,
                    keys: subscription.keys,
                    user: {
                        connect: { id: userId }
                    }
                }
            })
        }

        console.log('[PUSH_SUBSCRIBE] Subscription saved successfully')
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[PUSH_SUBSCRIBE_ERROR]', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { endpoint } = await req.json()
        await prisma.userPushSubscription.deleteMany({
            where: { endpoint }
        })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
