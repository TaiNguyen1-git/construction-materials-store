
import { NextRequest, NextResponse } from 'next/server'
import { disputeService } from '@/lib/dispute-service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { disputeId, authorId, content, attachments } = body

        if (!disputeId || !authorId || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const result = await disputeService.addComment({
            disputeId,
            authorId,
            content,
            attachments
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error adding dispute comment:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
