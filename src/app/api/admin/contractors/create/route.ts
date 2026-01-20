/**
 * API: Create Contractor Account (Admin/Staff)
 * POST /api/admin/contractors/create
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, name, phone, initialPassword } = body

        if (!email || !name) {
            return NextResponse.json(
                { error: { message: 'Email và tên là bắt buộc' } },
                { status: 400 }
            )
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: { message: 'Email này đã tồn tại trong hệ thống' } },
                { status: 400 }
            )
        }

        // Hash initial password
        const passwordToUse = initialPassword || Math.random().toString(36).slice(-8)
        const hashedPassword = await bcrypt.hash(passwordToUse, 10)

        // Create User with role CONTRACTOR and mustChangePassword = true
        const user = await prisma.user.create({
            data: {
                email,
                name,
                phone,
                password: hashedPassword,
                role: 'CONTRACTOR' as any,
                mustChangePassword: true,
                isActive: true
            }
        })

        // Create associated Customer record
        const customer = await prisma.customer.create({
            data: {
                userId: user.id,
                customerType: 'REGULAR' as any,
                contractorVerified: false
            }
        })

        // Initialize ContractorProfile
        await prisma.contractorProfile.create({
            data: {
                customerId: customer.id,
                displayName: name,
                onboardingStatus: 'INCOMPLETE',
                isVerified: false,
                trustScore: 80, // Initial trust score
                experienceYears: 0,
                skills: []
            }
        })

        // Create welcome notification
        await prisma.notification.create({
            data: {
                userId: user.id,
                title: '👋 Chào mừng đến với SmartBuild!',
                message: 'Tài khoản của bạn đã được tạo. Vui lòng đổi mật khẩu và cập nhật hồ sơ để bắt đầu nhận việc.',
                type: 'INFO',
                priority: 'HIGH'
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Đã tạo tài khoản thầu thành công',
            data: {
                email,
                temporaryPassword: initialPassword ? '******' : passwordToUse
            }
        })

    } catch (error) {
        console.error('Error creating contractor account:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi tạo tài khoản' } },
            { status: 500 }
        )
    }
}
