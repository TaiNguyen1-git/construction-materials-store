import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json()
        if (!email) return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })

        // Use upsert to avoid duplicate email error but reset isActive to true if previously unsubscribed
        const subscriber = await prisma.newsletterSubscriber.upsert({
            where: { email },
            update: { isActive: true },
            create: { email }
        })

        return NextResponse.json({ success: true, message: 'Subscribed successfully' })
    } catch (error) {
        console.error('Newsletter error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}
