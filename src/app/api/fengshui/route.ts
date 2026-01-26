import { NextRequest, NextResponse } from 'next/server'
import { getFengshuiAdvice } from '@/lib/fengshui-ai'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function POST(request: NextRequest) {
    try {
        const { year, direction, projectType } = await request.json()

        if (!year || !direction) {
            return NextResponse.json(createErrorResponse('Vui lòng nhập năm sinh và hướng nhà', 'VALIDATION_ERROR'), { status: 400 })
        }

        const advice = await getFengshuiAdvice(parseInt(year), direction, projectType || 'Tổng quát')

        return NextResponse.json(createSuccessResponse({ advice }))
    } catch (error: any) {
        console.error('Fengshui API Error:', error)
        return NextResponse.json(createErrorResponse('Lỗi hệ thống khi tư vấn phong thủy', 'INTERNAL_ERROR'), { status: 500 })
    }
}
