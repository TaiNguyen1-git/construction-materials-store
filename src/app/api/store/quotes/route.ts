import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const quotes = await prisma.quickQuote.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json({ success: true, data: quotes })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const quote = await prisma.quickQuote.create({
            data: {
                customerName: body.customerName,
                customerPhone: body.customerPhone,
                totalAmount: body.totalAmount,
                projectName: body.projectName,
                items: body.items || [],
                notes: body.notes,
                validUntil: body.validUntil ? new Date(body.validUntil) : null,
            }
        })
        return NextResponse.json({ success: true, data: quote })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
