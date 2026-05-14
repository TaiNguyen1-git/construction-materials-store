import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json()
        const { id } = params
        const expense = await prisma.storeExpense.update({
            where: { id },
            data: {
                category: body.category,
                amount: body.amount,
                description: body.description,
                date: body.date ? new Date(body.date) : undefined,
                paymentMethod: body.paymentMethod
            }
        })
        return NextResponse.json({ success: true, data: expense })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        await prisma.storeExpense.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
