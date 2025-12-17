/**
 * Supplier Authentication API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supplier-secret-key-change-in-production'

// POST /api/supplier/auth - Login
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                createErrorResponse('Email và mật khẩu là bắt buộc', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Find supplier by email
        const supplier = await prisma.supplier.findFirst({
            where: { email: email.toLowerCase() }
        })

        if (!supplier) {
            return NextResponse.json(
                createErrorResponse('Email không tồn tại', 'AUTH_ERROR'),
                { status: 401 }
            )
        }

        // Check if supplier has password set
        // For demo, we'll use a simple check
        // In production, you'd have a password field in the Supplier model
        const storedPassword = (supplier as any).password || 'supplier123'

        // Simple password check (in production, use bcrypt)
        const isValidPassword = password === storedPassword ||
            (storedPassword.startsWith('$2') && bcrypt.compareSync(password, storedPassword))

        if (!isValidPassword) {
            return NextResponse.json(
                createErrorResponse('Mật khẩu không đúng', 'AUTH_ERROR'),
                { status: 401 }
            )
        }

        // Generate token
        const token = jwt.sign(
            {
                supplierId: supplier.id,
                email: supplier.email,
                type: 'supplier'
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        return NextResponse.json(
            createSuccessResponse({
                token,
                supplier: {
                    id: supplier.id,
                    name: supplier.name,
                    email: supplier.email,
                    phone: supplier.phone
                }
            }, 'Đăng nhập thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Supplier auth error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi đăng nhập', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
