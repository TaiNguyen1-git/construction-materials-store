import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { logger } from '@/lib/logger'
import { hash } from 'bcryptjs'

// GET /api/admin/suppliers - List all suppliers with pagination and filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') // 'active', 'pending', 'inactive'
        const search = searchParams.get('search')

        let where: any = {}

        if (status === 'active') where.isActive = true
        if (status === 'inactive') where.isActive = false
        // For 'pending', we might need a specific flag or check isActive=false

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { taxId: { contains: search, mode: 'insensitive' } }
            ]
        }

        const suppliers = await prisma.supplier.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { products: true, purchaseOrders: true }
                }
            }
        })

        return NextResponse.json(createSuccessResponse(suppliers))
    } catch (error) {
        console.error('Fetch suppliers error:', error)
        return NextResponse.json(createErrorResponse('Failed to fetch suppliers', 'SERVER_ERROR'), { status: 500 })
    }
}

// POST /api/admin/suppliers - Create a new supplier manually
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, email, phone, taxId, address, city } = body

        if (!name || !taxId) {
            return NextResponse.json(createErrorResponse('Name and Tax ID are required', 'VALIDATION_ERROR'), { status: 400 })
        }

        const existingSupplier = await prisma.supplier.findFirst({
            where: { OR: [{ taxId }, { email: email || undefined }] }
        })

        if (existingSupplier) {
            return NextResponse.json(createErrorResponse('Supplier with this Tax ID or Email already exists', 'CONFLICT'), { status: 409 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(createErrorResponse('User with this email already exists', 'CONFLICT'), { status: 409 })
        }

        // Create user with default password '123456'
        const hashedPassword = await hash('123456', 10)

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'SUPPLIER',
                mustChangePassword: true
            }
        })

        const supplier = await prisma.supplier.create({
            data: {
                name,
                email,
                phone,
                taxId,
                address,
                city,
                isActive: true, // Admin created suppliers are active by default
                userId: user.id
            }
        })

        logger.info('Admin created new supplier', { supplierId: supplier.id })

        return NextResponse.json(createSuccessResponse(supplier, 'Supplier created successfully'), { status: 201 })
    } catch (error) {
        console.error('Create supplier error:', error)
        return NextResponse.json(createErrorResponse('Failed to create supplier', 'SERVER_ERROR'), { status: 500 })
    }
}

// PUT /api/admin/suppliers - Update supplier status
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, action } = body // action: 'approve', 'reject', 'deactivate'

        if (!id || !action) {
            return NextResponse.json(createErrorResponse('Missing required fields', 'VALIDATION_ERROR'), { status: 400 })
        }

        let updateData: any = {}
        let message = ''

        switch (action) {
            case 'approve':
                updateData = { isActive: true }
                message = 'Đã duyệt nhà cung cấp thành công'
                break
            case 'deactivate':
                updateData = { isActive: false }
                message = 'Đã ngưng kích hoạt nhà cung cấp'
                break
            case 'reject':
                updateData = { isActive: false, notes: 'Rejected by admin' }
                message = 'Đã từ chối nhà cung cấp'
                break
            case 'update':
                const { name, email, phone, taxId, address, city } = body
                updateData = { name, email, phone, taxId, address, city }
                message = 'Cập nhật thông tin thành công'
                break
            default:
                return NextResponse.json(createErrorResponse('Invalid action', 'VALIDATION_ERROR'), { status: 400 })
        }

        const supplier = await prisma.supplier.update({
            where: { id },
            data: updateData
        })

        // If approving, we might want to trigger an email here (mock for now)
        if (action === 'approve') {
            // EmailService.sendSupplierApprovalEmail(supplier.email, supplier.name)
        }

        return NextResponse.json(createSuccessResponse(supplier, message))
    } catch (error) {
        console.error('Update supplier status error:', error)
        return NextResponse.json(createErrorResponse('Failed to update supplier status', 'SERVER_ERROR'), { status: 500 })
    }
}
