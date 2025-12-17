/**
 * AI Estimator API
 * POST: Analyze floor plan image or text to estimate materials
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeFloorPlanImage, estimateFromText, EstimatorResult } from '@/lib/ai-vision-estimator'
import { z } from 'zod'

const estimatorSchema = z.object({
    image: z.string().optional(),
    description: z.string().optional(),
    projectType: z.enum(['flooring', 'painting', 'tiling', 'general']).optional().default('flooring'),
    sessionId: z.string().optional()
}).refine(data => data.image || data.description, {
    message: 'Either image or description is required'
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const validation = estimatorSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid request', details: validation.error.issues },
                { status: 400 }
            )
        }

        const { image, description, projectType } = validation.data

        let result: EstimatorResult

        if (image) {
            // Analyze floor plan image
            result = await analyzeFloorPlanImage(image, projectType)
        } else if (description) {
            // Estimate from text description
            result = await estimateFromText(description, projectType)
        } else {
            return NextResponse.json(
                { success: false, error: 'No input provided' },
                { status: 400 }
            )
        }

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            data: result
        })

    } catch (error: any) {
        console.error('Estimator API error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET: Get project types and info
export async function GET() {
    return NextResponse.json({
        success: true,
        projectTypes: [
            { id: 'flooring', name: 'Lát nền', description: 'Gạch lát, keo, chà ron' },
            { id: 'painting', name: 'Sơn tường', description: 'Sơn lót, sơn phủ' },
            { id: 'tiling', name: 'Ốp tường', description: 'Gạch ốp, keo dán' },
            { id: 'general', name: 'Tổng quát', description: 'Xi măng, cát, sắt thép' }
        ],
        instructions: {
            image: 'Upload ảnh bản vẽ mặt bằng hoặc ảnh phòng',
            text: 'Mô tả: "Lát sân 6x8m" hoặc "Sơn phòng khách 5x4m cao 3m"'
        }
    })
}
