
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { v4 as uuidv4 } from 'uuid'

// Mock Email Sender (Replace with real email service later)
async function sendProjectLinkEmail(email: string, projectName: string, link: string) {
    console.log(`[EMAIL MOCK] To: ${email}`)
    console.log(`Subject: Theo dõi tiến độ dự án: ${projectName}`)
    console.log(`Body: Chào bạn, mời bạn xem tiến độ dự án tại đây: ${link}`)
    return true
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { projectId, email } = body

        if (!projectId || !email) {
            return NextResponse.json(createErrorResponse('Thiếu thông tin Project ID hoặc Email', 'BAD_REQUEST'), { status: 400 })
        }

        // 1. Get Project
        const project = await (prisma as any).constructionProject.findUnique({
            where: { id: projectId }
        })

        if (!project) {
            return NextResponse.json(createErrorResponse('Dự án không tồn tại', 'NOT_FOUND'), { status: 404 })
        }

        // 2. Generate Share Token (if not exists or create new)
        // We can reuse ProjectReportToken model or add a new field. 
        // For public viewing, let's create a specific token type or reuse with a flag.
        // Let's create a new token record specifically for VIEWING.
        // But reusing ProjectReportToken with a type might be cleaner if schema supported it.
        // For now, I'll generate a unique token and store it in a new simple model or just use a dedicated "shareToken" field on the project if schema allows.
        // Checking schema... ConstructionProject doesn't have `shareToken`.
        // I will use `ProjectReportToken` but maybe use a prefix or just treat it as a viewer token.
        // Actually, let's double check ProjectReportToken schema. It's linked to ConstructionProject.
        // I'll create a new token there.

        const token = uuidv4()
        const shareRecord = await (prisma as any).projectReportToken.create({
            data: {
                token: `view-${token}`, // Prefix to distinguish viewer from reporter
                projectId: projectId,
                contractorId: project.customerId || 'system', // Ideally should be the contractor who shared it.
                isActive: true
            }
        })

        const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/project-tracking/${shareRecord.token}`

        // 3. Send Email
        await sendProjectLinkEmail(email, project.title, shareLink)

        // 4. Update Project with guest email if needed specific logging
        // (Optional)

        return NextResponse.json(createSuccessResponse({
            link: shareLink,
            emailSent: true
        }))

    } catch (error) {
        console.error('Share Project Error:', error)
        return NextResponse.json(createErrorResponse('Lỗi chia sẻ dự án', 'SERVER_ERROR'), { status: 500 })
    }
}
