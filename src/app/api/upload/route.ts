import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
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

        // Ensure public/uploads exists (manual creation might be needed or mkdir)
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        // const uploadDir = 'public/uploads' // Relative path

        // Simple distinct filename
        const uniqueName = `${uuidv4()}-${file.name}`
        const filePath = path.join(uploadDir, uniqueName)

        // Write file (Requires 'public/uploads' folder to exist)
        try {
            await writeFile(filePath, buffer)
        } catch (e: any) {
            // Try creating dir if fails? Or just returning error. 
            // Assuming public/uploads exists or I can create a util to ensure it.
            // For safety in this environment, I'll assume I need to create it manually via tool if this fails, 
            // but let's try writing.
            console.error('Write file error', e)
            return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
        }

        const fileUrl = `/uploads/${uniqueName}`

        return NextResponse.json({
            success: true,
            fileUrl,
            fileName: file.name,
            fileType: file.type
        })

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
