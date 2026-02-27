import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { token, lat, lng } = body

        if (!token || lat === undefined || lng === undefined) {
            return NextResponse.json({ error: 'Missing token, lat, or lng' }, { status: 400 })
        }

        const updated = await prisma.orderDelivery.update({
            where: { deliveryToken: token },
            data: {
                currentLat: lat,
                currentLng: lng,
                lastLocationUpdate: new Date()
            }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    try {
        const delivery = await prisma.orderDelivery.findUnique({
            where: { deliveryToken: token },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        shippingAddress: true,
                        totalAmount: true
                    }
                }
            }
        })

        if (!delivery) return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })

        return NextResponse.json({ success: true, data: delivery })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
