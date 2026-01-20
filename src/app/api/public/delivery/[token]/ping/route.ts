import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

/**
 * API for drivers to update their real-time location
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = (await params)
        const body = await request.json()
        const { lat, lng } = body

        if (!lat || !lng) {
            return NextResponse.json(createErrorResponse('Missing coordinates', 'VALIDATION_ERROR'), { status: 400 })
        }

        const delivery = await (prisma as any).orderDelivery.update({
            where: { deliveryToken: token },
            data: {
                currentLat: lat,
                currentLng: lng,
                lastLocationUpdate: new Date()
            }
        })

        return NextResponse.json(createSuccessResponse({ status: delivery.status }, 'Location updated'))
    } catch (error) {
        console.error('Driver ping error:', error)
        return NextResponse.json(createErrorResponse('Internal error', 'SERVER_ERROR'), { status: 500 })
    }
}
