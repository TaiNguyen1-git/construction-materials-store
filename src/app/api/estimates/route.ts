/**
 * API: Saved Estimates
 * POST - Save a new estimate
 * GET - List saved estimates for customer/session
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { customerId, sessionId, projectType, projectName, area, materials, totalCost, notes } = body

        // Validation
        if (!projectType || !area || !materials || totalCost === undefined) {
            return NextResponse.json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Thiếu thông tin bắt buộc: projectType, area, materials, totalCost' }
            }, { status: 400 })
        }

        if (!customerId && !sessionId) {
            return NextResponse.json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Cần có customerId hoặc sessionId' }
            }, { status: 400 })
        }

        if (area <= 0) {
            return NextResponse.json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Diện tích phải lớn hơn 0' }
            }, { status: 400 })
        }

        // Create saved estimate
        const estimate = await prisma.savedEstimate.create({
            data: {
                customerId: customerId || null,
                sessionId: sessionId || null,
                projectType,
                projectName: projectName || `Dự toán ${projectType}`,
                area,
                materials,
                totalCost,
                notes: notes || null
            }
        })

        return NextResponse.json({
            success: true,
            data: estimate,
            message: 'Đã lưu dự toán thành công!'
        })

    } catch (error) {
        console.error('Error saving estimate:', error)
        return NextResponse.json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Lỗi khi lưu dự toán' }
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const customerId = searchParams.get('customerId')
        const sessionId = searchParams.get('sessionId')
        const limit = parseInt(searchParams.get('limit') || '10')

        if (!customerId && !sessionId) {
            return NextResponse.json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Cần có customerId hoặc sessionId để lấy danh sách dự toán' }
            }, { status: 400 })
        }

        // Build where clause
        const where: any = {}
        if (customerId) {
            where.customerId = customerId
        }
        if (sessionId) {
            where.sessionId = sessionId
        }

        const estimates = await prisma.savedEstimate.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
        })

        return NextResponse.json({
            success: true,
            data: estimates,
            count: estimates.length
        })

    } catch (error) {
        console.error('Error fetching estimates:', error)
        return NextResponse.json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'Lỗi khi lấy danh sách dự toán' }
        }, { status: 500 })
    }
}
