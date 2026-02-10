import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const expenses = await prisma.storeExpense.findMany({
            orderBy: { date: 'desc' }
        })
        return NextResponse.json({ success: true, data: expenses })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const expense = await prisma.storeExpense.create({
            data: {
                category: body.category,
                amount: body.amount,
                description: body.description,
                date: body.date ? new Date(body.date) : new Date(),
                paymentMethod: body.paymentMethod || 'CASH'
            }
        })
        return NextResponse.json({ success: true, data: expense })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
