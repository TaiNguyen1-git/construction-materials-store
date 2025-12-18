import { NextRequest, NextResponse } from 'next/server'
import { getFile } from '@/lib/file-storage'
import { getMimeType } from '@/lib/file-storage'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        // In a real app, you might want to check authentication here
        // since these are "secure" files.

        const file = await getFile(id)

        if (!file) {
            return new NextResponse('File not found', { status: 404 })
        }

        const mimeType = getMimeType(file.filename)

        return new NextResponse(new Uint8Array(file.buffer), {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `inline; filename="${file.filename}"`,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        })
    } catch (error) {
        console.error('Error serving file:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
