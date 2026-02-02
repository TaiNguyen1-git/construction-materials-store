import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { hash } from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supplier-secret-key-change-in-production'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'AUTH_ERROR'), { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        let decoded: any
        try {
            decoded = jwt.verify(token, JWT_SECRET)
        } catch (e) {
            return NextResponse.json(createErrorResponse('Invalid token', 'AUTH_ERROR'), { status: 401 })
        }

        const { password } = await request.json()
        if (!password || password.length < 6) {
            return NextResponse.json(createErrorResponse('Password must be at least 6 characters', 'VALIDATION_ERROR'), { status: 400 })
        }

        const supplier = await prisma.supplier.findUnique({
            where: { id: decoded.supplierId },
            include: { user: true }
        })

        if (!supplier) {
            return NextResponse.json(createErrorResponse('Supplier not found', 'NOT_FOUND'), { status: 404 })
        }

        const hashedPassword = await hash(password, 10)

        // Update User password if linked, otherwise Supplier (legacy)
        if (supplier.userId) {
            await prisma.user.update({
                where: { id: supplier.userId },
                data: {
                    password: hashedPassword,
                    mustChangePassword: false
                }
            })
        } else {
            // Fallback for legacy
            await prisma.supplier.update({
                where: { id: supplier.id },
                data: { password: hashedPassword } // Schema has password field
            })
        }

        return NextResponse.json(createSuccessResponse(null, 'Password updated successfully'))
    } catch (error) {
        console.error('Change password error:', error)
        return NextResponse.json(createErrorResponse('Failed to update password', 'SERVER_ERROR'), { status: 500 })
    }
}
