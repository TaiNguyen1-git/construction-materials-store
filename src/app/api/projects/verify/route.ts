import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { projectId, otpCode } = await request.json()

        if (!projectId || !otpCode) {
            return NextResponse.json({ error: 'Project ID and OTP are required' }, { status: 400 })
        }

        const project = await (prisma as any).project.findUnique({
            where: { id: projectId }
        })

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        if (project.isVerified) {
            return NextResponse.json({ message: 'Project already verified' }, { status: 200 })
        }

        // Check OTP
        if (project.otpCode !== otpCode) {
            return NextResponse.json({ error: 'Mã xác thực không chính xác' }, { status: 400 })
        }

        // Check expiry
        if (new Date() > new Date(project.otpExpiresAt)) {
            return NextResponse.json({ error: 'Mã xác thực đã hết hạn' }, { status: 400 })
        }

        // Update project
        await (prisma as any).project.update({
            where: { id: projectId },
            data: {
                isVerified: true,
                otpCode: null, // Clear OTP after use
                otpExpiresAt: null
            }
        })

        return NextResponse.json({ success: true, message: 'Xác thực thành công!' })

    } catch (error) {
        console.error('Error verifying project:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
