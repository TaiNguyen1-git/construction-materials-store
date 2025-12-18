/**
 * Secure File Upload API
 * POST: Upload a file to private storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveFile, getMimeType } from '@/lib/file-storage'

// Allowed file types - Expanded for employee task proofs
const ALLOWED_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    // Documents
    'application/pdf',
    // Microsoft Office
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    // Text
    'text/plain', // .txt
    'text/csv', // .csv
    // Video
    'video/mp4',
    'video/webm',
    'video/quicktime', // .mov
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB for larger documents

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
                { error: 'Loại file không được hỗ trợ. Vui lòng tải lên: ảnh (JPG, PNG, WebP, GIF), tài liệu (PDF, Word, Excel, PowerPoint), hoặc video (MP4, WebM).' },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File quá lớn. Kích thước tối đa là 10MB.' },
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
