
import { NextRequest, NextResponse } from 'next/server'
import { disputeService } from '@/lib/dispute-service'
// @ts-ignore
import { DisputeStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const customerId = searchParams.get('customerId')
        const contractorId = searchParams.get('contractorId')

        if (customerId) {
            const disputes = await disputeService.getCustomerDisputes(customerId)
            return NextResponse.json(disputes)
        }

        if (contractorId) {
            const disputes = await disputeService.getContractorDisputes(contractorId)
            return NextResponse.json(disputes)
        }

        // Default to all for admin (should have auth check in real app)
        const disputes = await disputeService.getAllDisputes()
        return NextResponse.json(disputes)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const result = await disputeService.openDispute(body)
        return NextResponse.json(result)
    } catch (error) {
        console.error('Error opening dispute:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { disputeId, resolution, status, adminId } = body

        if (!disputeId || !resolution || !status || !adminId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const result = await disputeService.resolveDispute(disputeId, resolution, status as DisputeStatus, adminId)
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
