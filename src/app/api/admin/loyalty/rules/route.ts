import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// GET: Lấy cấu hình quy tắc loyalty hiện tại
export async function GET() {
    try {
        let rule = await prisma.loyaltyRule.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        })

        // Nếu chưa có rule nào, tạo rule mặc định
        if (!rule) {
            rule = await prisma.loyaltyRule.create({
                data: {
                    name: 'Quy tắc mặc định',
                    description: 'Cấu hình tích điểm mặc định của hệ thống',
                    pointsPerAmount: 1,
                    roundingMode: 'FLOOR',
                    isActive: true,
                    bronzeThreshold: 0,
                    silverThreshold: 1000,
                    goldThreshold: 2500,
                    platinumThreshold: 5000,
                    diamondThreshold: 10000,
                    bronzeMultiplier: 1.0,
                    silverMultiplier: 1.2,
                    goldMultiplier: 1.5,
                    platinumMultiplier: 2.0,
                    diamondMultiplier: 2.5,
                    bronzeDiscount: 2,
                    silverDiscount: 5,
                    goldDiscount: 10,
                    platinumDiscount: 15,
                    diamondDiscount: 20,
                    referralPoints: 100,
                    earlyPaymentBonus: 1.5,
                }
            })
        }

        return NextResponse.json(
            createSuccessResponse(rule, 'Lấy cấu hình thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error fetching loyalty rules:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

// PUT: Cập nhật cấu hình quy tắc loyalty
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()

        // Find or create active rule
        let rule = await prisma.loyaltyRule.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        })

        if (rule) {
            rule = await prisma.loyaltyRule.update({
                where: { id: rule.id },
                data: {
                    name: body.name ?? rule.name,
                    description: body.description ?? rule.description,
                    pointsPerAmount: body.pointsPerAmount ?? rule.pointsPerAmount,
                    roundingMode: body.roundingMode ?? rule.roundingMode,
                    expirationMonths: body.expirationMonths !== undefined ? body.expirationMonths : rule.expirationMonths,
                    bronzeThreshold: body.bronzeThreshold ?? rule.bronzeThreshold,
                    silverThreshold: body.silverThreshold ?? rule.silverThreshold,
                    goldThreshold: body.goldThreshold ?? rule.goldThreshold,
                    platinumThreshold: body.platinumThreshold ?? rule.platinumThreshold,
                    diamondThreshold: body.diamondThreshold ?? rule.diamondThreshold,
                    bronzeMultiplier: body.bronzeMultiplier ?? rule.bronzeMultiplier,
                    silverMultiplier: body.silverMultiplier ?? rule.silverMultiplier,
                    goldMultiplier: body.goldMultiplier ?? rule.goldMultiplier,
                    platinumMultiplier: body.platinumMultiplier ?? rule.platinumMultiplier,
                    diamondMultiplier: body.diamondMultiplier ?? rule.diamondMultiplier,
                    bronzeDiscount: body.bronzeDiscount ?? rule.bronzeDiscount,
                    silverDiscount: body.silverDiscount ?? rule.silverDiscount,
                    goldDiscount: body.goldDiscount ?? rule.goldDiscount,
                    platinumDiscount: body.platinumDiscount ?? rule.platinumDiscount,
                    diamondDiscount: body.diamondDiscount ?? rule.diamondDiscount,
                    referralPoints: body.referralPoints ?? rule.referralPoints,
                    earlyPaymentBonus: body.earlyPaymentBonus ?? rule.earlyPaymentBonus,
                }
            })
        } else {
            rule = await prisma.loyaltyRule.create({
                data: {
                    name: body.name || 'Quy tắc mặc định',
                    description: body.description || '',
                    pointsPerAmount: body.pointsPerAmount ?? 1,
                    roundingMode: body.roundingMode ?? 'FLOOR',
                    isActive: true,
                    ...body,
                }
            })
        }

        return NextResponse.json(
            createSuccessResponse(rule, 'Cập nhật cấu hình thành công'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error updating loyalty rules:', error)
        return NextResponse.json(
            createErrorResponse('Lỗi hệ thống', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
