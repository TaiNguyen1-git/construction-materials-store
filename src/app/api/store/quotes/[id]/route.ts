import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireEmployee } from '@/lib/auth-middleware-api'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = requireEmployee(request)
    if (authError) return authError

    const { id } = await params
    try {
        const quote = await prisma.quickQuote.findUnique({
            where: { id }
        })
        if (!quote) return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 })
        return NextResponse.json({ success: true, data: quote })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = requireEmployee(request)
    if (authError) return authError

    const { id } = await params
    const { status } = await request.json()

    try {
        const quote = await prisma.quickQuote.update({
            where: { id },
            data: { status }
        })
        return NextResponse.json({ success: true, data: quote })
    } catch (error) {
        console.error('Update quote error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update quote' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authError = requireEmployee(request)
    if (authError) return authError

    const { id } = await params

    try {
        await prisma.quickQuote.delete({
            where: { id }
        })
        return NextResponse.json({ success: true, message: 'Quote deleted' })
    } catch (error) {
        console.error('Delete quote error:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete quote' }, { status: 500 })
    }
}
