/**
 * Quick Registration API
 * Converts guest applicants to registered users
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'smartbuild-secret-key'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, phone, email, password } = body

        // Validation
        if (!name || !phone || !password) {
            return NextResponse.json(
                createErrorResponse('Thiếu thông tin bắt buộc', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                createErrorResponse('Mật khẩu cần ít nhất 6 ký tự', 'VALIDATION_ERROR'),
                { status: 400 }
            )
        }

        // Check if phone already exists
        const existingUser = await prisma.user.findFirst({
            where: { phone }
        })

        if (existingUser) {
            return NextResponse.json(
                createErrorResponse('Số điện thoại đã được đăng ký', 'CONFLICT'),
                { status: 409 }
            )
        }

        // Check email if provided
        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: { email }
            })
            if (existingEmail) {
                return NextResponse.json(
                    createErrorResponse('Email đã được đăng ký', 'CONFLICT'),
                    { status: 409 }
                )
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                phone,
                email: email || null,
                password: hashedPassword,
                role: 'CUSTOMER',
                isActive: true
            }
        })

        // Create customer profile
        const customer = await prisma.customer.create({
            data: {
                userId: user.id
            }
        })

        // Create contractor profile (since they're applying for jobs)
        await prisma.contractorProfile.create({
            data: {
                customerId: customer.id,
                displayName: name,
                phone,
                email: email || null,
                isVerified: false,
                trustScore: 80 // New registered users start at 80
            }
        })

        // Update any existing guest applications with this phone to link to new user
        // Note: We use raw update since isGuest is a new field
        try {
            await prisma.$runCommandRaw({
                update: 'project_applications',
                updates: [{
                    q: { guestPhone: phone, isGuest: true },
                    u: { $set: { contractorId: customer.id, isGuest: false } },
                    multi: true
                }]
            })
        } catch (e) {
            // Ignore if collection doesn't exist or no matches
            console.log('No guest applications to update')
        }

        // Generate JWT token
        const accessToken = jwt.sign(
            { userId: user.id, role: user.role, customerId: customer.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        return NextResponse.json(
            createSuccessResponse({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                },
                customerId: customer.id,
                accessToken
            }, 'Đăng ký thành công! Chào mừng bạn đến SmartBuild'),
            { status: 201 }
        )
    } catch (error) {
        console.error('Quick register error:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi đăng ký', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
