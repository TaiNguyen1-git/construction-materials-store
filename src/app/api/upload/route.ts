import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse } from '@/lib/api-types'

export async function POST(request: NextRequest) {
    // In a real app, this would use Cloudinary, AWS S3, or local storage
    // For this demo/ERP, we return a themed placeholder URL

    const formData = await request.formData()
    const file = formData.get('file') as File

    console.log('Mock upload received file:', file?.name)

    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 800))

    return NextResponse.json(createSuccessResponse({
        url: `https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80`, // Construction themed fallback
        fileName: file?.name || 'document.pdf',
        size: file?.size || 0
    }, 'Tải lên thành công'))
}
