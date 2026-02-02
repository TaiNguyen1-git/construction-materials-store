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

        // Find supplier by email and include user relation
        const supplier = await prisma.supplier.findFirst({
            where: { email: email.toLowerCase() },
            include: { user: true } // Include linked user record
        })

        if (!supplier) {
            return NextResponse.json(
                createErrorResponse('Email không tồn tại', 'AUTH_ERROR'),
                { status: 401 }
            )
        }

        let isValidPassword = false
        let mustChangePassword = false

        if (supplier.user) {
            // If linked to a User record, use User's password and status
            const isMatch = await bcrypt.compare(password, supplier.user.password)
            if (isMatch) {
                isValidPassword = true
                mustChangePassword = supplier.user.mustChangePassword
            }
        } else {
            // Fallback to legacy Supplier password
            const storedPassword = supplier.password || 'supplier123'
            isValidPassword = password === storedPassword ||
                (storedPassword.startsWith('$2') && await bcrypt.compare(password, storedPassword))
        }

        if (!isValidPassword) {
            return NextResponse.json(
                createErrorResponse('Mật khẩu không đúng', 'AUTH_ERROR'),
                { status: 401 }
            )
        }

        // Check 2FA status
        if ((supplier as any).is2FAEnabled) {
            return NextResponse.json(
                createSuccessResponse({
                    status: '2FA_REQUIRED',
                    supplierId: supplier.id,
                    email: supplier.email
                }, 'Vui lòng nhập mã xác thực 2 lớp'),
                { status: 200 }
            )
        }

        // Generate token
        const token = jwt.sign(
            {
                supplierId: supplier.id,
                userId: supplier.id, // For compatibility with verifyTokenFromRequest
                email: supplier.email,
                role: 'SUPPLIER', // For compatibility with verifyTokenFromRequest
                type: 'supplier',
                mustChangePassword // Add to token payload
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
                    phone: supplier.phone,
                    mustChangePassword
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
