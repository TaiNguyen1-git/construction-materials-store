import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { logger } from '@/lib/logger'

// GET /api/supplier/profile
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')

        if (!supplierId) {
            return NextResponse.json(createErrorResponse('Missing supplierId', 'VALIDATION_ERROR'), { status: 400 })
        }

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            select: {
                id: true,
                name: true,
                contactPerson: true,
                email: true,
                phone: true,
                address: true,
                taxId: true,
                bankName: true,
                bankAccountNumber: true,
                bankAccountName: true,
            }
        })

        if (!supplier) {
            return NextResponse.json(createErrorResponse('Supplier not found', 'NOT_FOUND'), { status: 404 })
        }

        return NextResponse.json(createSuccessResponse(supplier))
    } catch (error) {
        console.error('Fetch profile error:', error)
        return NextResponse.json(createErrorResponse('Failed to fetch profile', 'SERVER_ERROR'), { status: 500 })
    }
}

// PUT /api/supplier/profile
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { supplierId, currentPassword, newPassword, ...updateData } = body

        if (!supplierId) {
            return NextResponse.json(createErrorResponse('Missing supplierId', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Logic Change Password
        let passwordUpdate = {}
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(createErrorResponse('Vui lòng nhập mật khẩu hiện tại', 'VALIDATION_ERROR'), { status: 400 })
            }

            const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } })
            if (!supplier) {
                return NextResponse.json(createErrorResponse('Supplier not found', 'NOT_FOUND'), { status: 404 })
            }

            // Simple comparison (In production, use bcrypt)
            if (supplier.password !== currentPassword) {
                return NextResponse.json(createErrorResponse('Mật khẩu hiện tại không đúng', 'AUTH_ERROR'), { status: 401 })
            }

            passwordUpdate = { password: newPassword }
        }

        const updatedSupplier = await prisma.supplier.update({
            where: { id: supplierId },
            data: {
                ...updateData,
                ...passwordUpdate
            }
        })

        return NextResponse.json(createSuccessResponse(updatedSupplier, 'Cập nhật thông tin thành công'))
    } catch (error) {
        console.error('Update profile error:', error)
        return NextResponse.json(createErrorResponse('Failed to update profile', 'SERVER_ERROR'), { status: 500 })
    }
}
// POST /api/supplier/profile
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, name, taxId, email, phone, address, city, categories } = body

        if (!userId || !name || !email) {
            return NextResponse.json(createErrorResponse('Missing required fields', 'VALIDATION_ERROR'), { status: 400 })
        }

        // Check if supplier already exists for this user
        const existingSupplier = await prisma.supplier.findUnique({
            where: { userId }
        })

        if (existingSupplier) {
            return NextResponse.json(createErrorResponse('Hồ sơ nhà cung cấp đã tồn tại cho tài khoản này', 'CONFLICT'), { status: 409 })
        }

        const supplier = await prisma.supplier.create({
            data: {
                userId,
                name,
                taxId,
                email,
                phone,
                address,
                city,
                notes: categories ? `Ngành hàng: ${categories}` : undefined,
                isActive: false // For review
            }
        })

        logger.info('New supplier profile created', { supplierId: supplier.id, userId })

        return NextResponse.json(createSuccessResponse(supplier, 'Tạo hồ sơ nhà cung cấp thành công'), { status: 201 })
    } catch (error) {
        console.error('Create supplier profile error:', error)
        return NextResponse.json(createErrorResponse('Failed to create supplier profile', 'SERVER_ERROR'), { status: 500 })
    }
}
