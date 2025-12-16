/**
 * Document Viewer API
 * GET: Retrieve a document from private storage (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFile, getMimeType } from '@/lib/file-storage'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: fileId } = await params

        // Check authentication
        const decoded = verifyTokenFromRequest(request)
        if (!decoded || !decoded.userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get user and check role
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        })

        if (!user || !['MANAGER', 'EMPLOYEE'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Access denied. Admin privileges required.' },
                { status: 403 }
            )
        }

        // Get file from private storage
        const file = await getFile(fileId)
        if (!file) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            )
        }

        // Determine content type
        const contentType = getMimeType(file.filename)

        // Return file as response - convert Buffer to Uint8Array
        return new NextResponse(new Uint8Array(file.buffer), {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${file.filename}"`,
                'Cache-Control': 'private, max-age=3600'
            }
        })

    } catch (error) {
        console.error('Error retrieving document:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve document' },
            { status: 500 }
        )
    }
}
