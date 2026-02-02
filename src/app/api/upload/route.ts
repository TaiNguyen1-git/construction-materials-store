import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadDir = path.join(process.cwd(), 'public', 'uploads')

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true })

        const uniqueName = `${uuidv4()}-${file.name}`
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
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
