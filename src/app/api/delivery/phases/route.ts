
import { NextRequest, NextResponse } from 'next/server'
import { deliveryService } from '@/lib/delivery-service'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const orderId = searchParams.get('orderId')

        if (!orderId) {
            return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
        }

        const phases = await deliveryService.getOrderPhases(orderId)
        return NextResponse.json(phases)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId, phases } = body

        if (!orderId || !phases) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const result = await deliveryService.createPhases(orderId, phases)
        return NextResponse.json(result)
    } catch (error) {
        console.error('Error creating phases:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { phaseId, status, actualDate } = body

        if (!phaseId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const result = await deliveryService.updatePhaseStatus(phaseId, status, actualDate ? new Date(actualDate) : undefined)
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
