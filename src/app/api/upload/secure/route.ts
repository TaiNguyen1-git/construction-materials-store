/**
 * Secure File Upload API
 * POST: Upload a file to private storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveFile, getMimeType } from '@/lib/file-storage'

// Allowed file types
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        const mimeType = file.type || getMimeType(file.name)
        if (!ALLOWED_TYPES.includes(mimeType)) {
            return NextResponse.json(
                { error: 'File type not allowed. Please upload PDF, JPG, PNG, or WebP files.' },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            )
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Save file to private storage
        const storedFile = await saveFile(buffer, file.name, mimeType)

        return NextResponse.json({
            success: true,
            fileId: storedFile.id,
            originalName: storedFile.originalName,
            size: storedFile.size,
            message: 'File uploaded successfully'
        })

    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        )
    }
}
