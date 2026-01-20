/**
 * Project Match Notification Preferences API
 * Allows contractors to set their project notification preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

// GET - Get current notification preferences
export async function GET(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Customer not found', 'NOT_FOUND'), { status: 404 })
        }

        // Get contractor profile
        const profile = await prisma.contractorProfile.findFirst({
            where: { customerId: customer.id },
            select: {
                id: true,
                skills: true,
                city: true,
                district: true,
                isAvailable: true
            }
        })

        if (!profile) {
            return NextResponse.json(
                createSuccessResponse({
                    hasProfile: false,
                    preferences: null
                }, 'Chưa có hồ sơ nhà thầu'),
                { status: 200 }
            )
        }

        return NextResponse.json(
            createSuccessResponse({
                hasProfile: true,
                preferences: {
                    skills: profile.skills || [],
                    city: profile.city,
                    district: profile.district,
                    isAvailable: profile.isAvailable,
                    notificationsEnabled: true // Always enabled for now
                }
            }, 'Cài đặt thông báo'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get notification prefs error:', error)
        return NextResponse.json(createErrorResponse('Lỗi tải dữ liệu', 'SERVER_ERROR'), { status: 500 })
    }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const { skills, city, district, isAvailable } = body

        const customer = await prisma.customer.findFirst({
            where: { userId: payload.userId }
        })

        if (!customer) {
            return NextResponse.json(createErrorResponse('Customer not found', 'NOT_FOUND'), { status: 404 })
        }

        // Update contractor profile
        let profile = await prisma.contractorProfile.findFirst({
            where: { customerId: customer.id }
        })

        if (profile) {
            profile = await prisma.contractorProfile.update({
                where: { id: profile.id },
                data: {
                    skills: skills || profile.skills,
                    city: city || profile.city,
                    district: district || profile.district,
                    isAvailable: isAvailable !== undefined ? isAvailable : profile.isAvailable
                }
            })
        } else {
            // Create new profile
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: { name: true, email: true, phone: true }
            })

            profile = await prisma.contractorProfile.create({
                data: {
                    customerId: customer.id,
                    displayName: user?.name || 'Nhà thầu',
                    email: user?.email,
                    phone: user?.phone,
                    skills: skills || [],
                    city: city || null,
                    district: district || null,
                    isAvailable: isAvailable !== undefined ? isAvailable : true
                }
            })
        }

        return NextResponse.json(
            createSuccessResponse({ profile }, 'Đã cập nhật cài đặt thông báo'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Update notification prefs error:', error)
        return NextResponse.json(createErrorResponse('Lỗi cập nhật', 'SERVER_ERROR'), { status: 500 })
    }
}
