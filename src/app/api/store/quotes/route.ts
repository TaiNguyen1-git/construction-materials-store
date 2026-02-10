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
        const currentUser = await getUser()

        // Fetch official name from DB since JWT only contains ID
        const staff = currentUser ? await prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: { name: true }
        }) : null

        // Prepare quote data
        const quoteData = {
            customerName: body.customerName,
            customerPhone: body.customerPhone,
            totalAmount: body.totalAmount,
            projectName: body.projectName,
            items: body.items || [],
            notes: body.notes,
            validUntil: body.validUntil ? new Date(body.validUntil) : null,
            staffId: currentUser?.userId || null,
            staffName: staff?.name || 'Nhân viên'
        }

        // Using a more specific cast to avoid 'any' while types are being updated
        // Note: Please restart 'npm run dev' and run 'npx prisma generate' to update official types
        const quote = await prisma.quickQuote.create({
            data: quoteData as unknown as Parameters<typeof prisma.quickQuote.create>[0]['data']
        })

        return NextResponse.json({ success: true, data: quote })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
