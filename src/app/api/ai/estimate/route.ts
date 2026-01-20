/**
 * API: AI Project Material Estimator
 * POST /api/ai/estimate
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simulated AI logic for matching materials
// In a real scenario, this would call OpenAI or Gemini via Vercel AI SDK
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { description, projectType, area } = body

        if (!description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 })
        }

        // 1. In a real app, we'd send 'description' to AI to get a JSON of materials
        // Example AI output: [{ name: 'Xi măng', quantity: 50, unit: 'bao' }, { name: 'Cát xây', quantity: 10, unit: 'm3' }]

        // For demonstration, let's use a keyword matching logic that simulates AI extraction
        const materialKeywords = [
            { key: 'xi măng', name: 'Xi măng' },
            { key: 'gạch', name: 'Gạch' },
            { key: 'cát', name: 'Cát' },
            { key: 'đá', name: 'Đá' },
            { key: 'sắt', name: 'Sắt' },
            { key: 'thép', name: 'Thép' },
            { key: 'sơn', name: 'Sơn' },
            { key: 'điện', name: 'Dây điện' },
            { key: 'ống', name: 'Ống nước' },
            { key: 'gỗ', name: 'Gỗ' },
            { key: 'thạch cao', name: 'Thạch cao' }
        ]

        const detectedMaterials = materialKeywords.filter(m =>
            description.toLowerCase().includes(m.key)
        )

        // 2. Match with real products in DB
        const recommendations = await Promise.all(
            detectedMaterials.map(async (detected) => {
                const products = await prisma.product.findMany({
                    where: {
                        OR: [
                            { name: { contains: detected.name, mode: 'insensitive' } },
                            { description: { contains: detected.name, mode: 'insensitive' } }
                        ],
                        isActive: true
                    },
                    take: 2,
                    include: {
                        category: true
                    }
                })

                if (products.length > 0) {
                    // Calculate an estimated quantity based on area if provided
                    // This is a dummy multiplier for demo
                    const baseQty = area ? parseFloat(area) * 0.5 : 10

                    return products.map(p => ({
                        productId: p.id,
                        name: p.name,
                        price: p.price,
                        unit: p.unit,
                        category: p.category?.name,
                        recommendedQty: Math.ceil(baseQty),
                        confidence: 0.85 + (Math.random() * 0.1), // Simulated AI confidence score
                        reason: `Dựa trên yêu cầu ${detected.name} cho công trình ${projectType || 'xây dựng'}.`
                    }))
                }
                return []
            })
        )

        const flattened = recommendations.flat()

        return NextResponse.json({
            success: true,
            data: {
                summary: `Hệ thống AI đã phân tích nội dung và tìm thấy ${detectedMaterials.length} nhóm vật tư phù hợp.`,
                recommendations: flattened
            }
        })

    } catch (error) {
        console.error('AI Estimation Error:', error)
        return NextResponse.json(
            { error: { message: 'Lỗi khi xử lý AI' } },
            { status: 500 }
        )
    }
}
