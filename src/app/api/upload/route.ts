import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Whitelist of allowed MIME types and their corresponding extensions
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    // Archive & CAD files for Construction
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-zip-compressed': ['.zip'],
    'image/vnd.dwg': ['.dwg'],
    'image/vnd.dxf': ['.dxf'],
    'application/acad': ['.dwg'],
    // Octet-stream is loosely used for CAD/Archives sometimes
    'application/octet-stream': ['.dwg', '.dxf', '.zip', '.rar', '.7z'],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Sanitize filename: remove path traversal and special characters, keep only safe chars
 */
function sanitizeFileName(name: string): string {
    // Get only the basename (prevent path traversal like ../../etc/passwd)
    const baseName = path.basename(name)
    // Remove all characters except alphanumeric, dots, dashes, underscores
    return baseName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
        }

        // 1. Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: `File quá lớn. Tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            )
        }

        // 2. Validate MIME type against whitelist
        const allowedExtensions = ALLOWED_MIME_TYPES[file.type]
        if (!allowedExtensions) {
            return NextResponse.json(
                { success: false, error: `Loại file không được phép: ${file.type}. Chỉ chấp nhận ảnh (JPEG, PNG, GIF, WebP), PDF và tài liệu Office.` },
                { status: 400 }
            )
        }

        // 3. Validate file extension matches MIME type
        const fileExt = path.extname(file.name).toLowerCase()
        if (!allowedExtensions.includes(fileExt)) {
            return NextResponse.json(
                { success: false, error: `Phần mở rộng file (${fileExt}) không khớp với loại file (${file.type}).` },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadDir = path.join(process.cwd(), 'public', 'uploads')

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true })

        // 4. Use UUID + sanitized name + validated extension for safe filename
        const sanitizedName = sanitizeFileName(path.parse(file.name).name)
        const uniqueName = `${uuidv4()}-${sanitizedName}${fileExt}`
        const filePath = path.join(uploadDir, uniqueName)

        await writeFile(filePath, buffer)

        const fileUrl = `/uploads/${uniqueName}`

        return NextResponse.json({
            success: true,
            fileUrl,
            fileName: file.name,
            fileType: file.type
        })

    } catch (error: any) {
        console.error('Upload API error:', error)
        return NextResponse.json({ success: false, error: 'Lỗi khi tải file lên' }, { status: 500 })
    }
}
