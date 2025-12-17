import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            productId,
            productName,
            predictedDemand,
            recommendedOrder,
            actualOverride,
            timestamp,
            timeContext
        } = body

        // Tìm prediction gần nhất cho sản phẩm này
        const latestPrediction = await prisma.inventoryPrediction.findFirst({
            where: {
                productId: productId,
                isActive: true
            },
            orderBy: {
                predictionDate: 'desc'
            }
        })

        if (latestPrediction) {
            // Cập nhật prediction với dữ liệu thực tế
            const accuracy = 100 - Math.abs((actualOverride - recommendedOrder) / recommendedOrder * 100)
            const error = Math.abs(actualOverride - recommendedOrder)

            await prisma.inventoryPrediction.update({
                where: { id: latestPrediction.id },
                data: {
                    actualDemand: actualOverride,
                    accuracy: Math.max(0, Math.min(100, accuracy)),
                    error: error,
                    validatedAt: new Date(timestamp),
                    // Lưu thêm time context vào factors để học pattern
                    factors: {
                        ...(latestPrediction.factors as any),
                        manualOverride: {
                            value: actualOverride,
                            timestamp: timestamp,
                            timeContext: timeContext,
                            // Ghi nhận pattern lặp lại
                            seasonalPattern: {
                                month: timeContext.month,
                                quarter: timeContext.quarter,
                                week: timeContext.week,
                                dayOfWeek: timeContext.dayOfWeek
                            }
                        }
                    }
                }
            })

            console.log(`✅ Saved override for ${productName}:`, {
                predicted: recommendedOrder,
                actual: actualOverride,
                accuracy: accuracy.toFixed(2) + '%',
                timeContext: timeContext
            })

            return NextResponse.json({
                success: true,
                message: 'Đã lưu dữ liệu học máy thành công',
                data: {
                    productName,
                    accuracy: accuracy.toFixed(2),
                    timeContext
                }
            })
        } else {
            // Tạo mới prediction nếu chưa có
            await prisma.inventoryPrediction.create({
                data: {
                    productId: productId,
                    predictionDate: new Date(),
                    targetDate: new Date(),
                    timeframe: 'MONTH',
                    predictedDemand: predictedDemand,
                    confidence: 0.5, // Default confidence
                    method: 'MANUAL_OVERRIDE',
                    recommendedOrder: recommendedOrder,
                    actualDemand: actualOverride,
                    accuracy: 100 - Math.abs((actualOverride - recommendedOrder) / recommendedOrder * 100),
                    error: Math.abs(actualOverride - recommendedOrder),
                    validatedAt: new Date(timestamp),
                    factors: {
                        manualOverride: {
                            value: actualOverride,
                            timestamp: timestamp,
                            timeContext: timeContext,
                            seasonalPattern: {
                                month: timeContext.month,
                                quarter: timeContext.quarter,
                                week: timeContext.week,
                                dayOfWeek: timeContext.dayOfWeek
                            }
                        }
                    }
                }
            })

            console.log(`✅ Created new prediction with override for ${productName}:`, {
                predicted: recommendedOrder,
                actual: actualOverride,
                timeContext: timeContext
            })

            return NextResponse.json({
                success: true,
                message: 'Đã tạo và lưu dữ liệu học máy thành công',
                data: {
                    productName,
                    timeContext
                }
            })
        }

    } catch (error) {
        console.error('Error saving override:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}
