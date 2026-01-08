
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            name,
            phone,
            email,
            message,
            attachments,
            systemInfo,
            pageUrl,
            userId
        } = body

        if (!name || !phone || !message) {
            return NextResponse.json(
                createErrorResponse('Vui lòng điền đầy đủ thông tin (Tên, SĐT, Nội dung)', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Additional security check for attachments (if any)
        if (attachments && Array.isArray(attachments)) {
            const FORBIDDEN_EXTENSIONS = ['exe', 'msi', 'bat', 'sh', 'js', 'vbs']
            for (const file of attachments) {
                const extension = file.fileName.split('.').pop()?.toLowerCase() || ''
                if (FORBIDDEN_EXTENSIONS.includes(extension)) {
                    return NextResponse.json(
                        createErrorResponse(`File .${extension} không được phép vì lý do bảo mật`, 'SECURITY_ERROR'),
                        { status: 403 }
                    )
                }
            }
        }

        // Get IP and UserAgent from headers
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
        const userAgent = request.headers.get('user-agent') || 'Unknown'

        // Save support request
        const supportRequest = await prisma.supportRequest.create({
            data: {
                name,
                phone,
                email: email || null,
                message,
                attachments: (attachments as any) || null,
                ipAddress: ip,
                userAgent: userAgent,
                browserName: systemInfo?.browserName,
                browserVersion: systemInfo?.browserVersion,
                osName: systemInfo?.osName,
                osVersion: systemInfo?.osVersion,
                deviceType: systemInfo?.deviceType,
                screenRes: systemInfo?.screenRes,
                pageUrl: pageUrl,
                userId: userId || null,
                priority: 'MEDIUM',
                status: 'PENDING'
            }
        })

        return NextResponse.json(
            createSuccessResponse(supportRequest, 'Gửi yêu cầu hỗ trợ thành công. Chúng tôi sẽ liên hệ lại sớm nhất!'),
            { status: 201 }
        )
    } catch (error) {
        console.error('Support request error:', error)
        return NextResponse.json(
            createErrorResponse('Đã có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
