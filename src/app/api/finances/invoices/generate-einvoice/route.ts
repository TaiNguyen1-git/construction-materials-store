import { NextRequest, NextResponse } from 'next/server'
import { EInvoiceService } from '@/lib/einvoice-service'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'MANAGER' && userRole !== 'EMPLOYEE') {
      return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 })
    }

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json(createErrorResponse('Missing orderId', 'VALIDATION_ERROR'), { status: 400 })
    }

    const result = await EInvoiceService.issueInvoice(orderId)

    return NextResponse.json(createSuccessResponse(result, 'Xuất hóa đơn thành công'))
  } catch (error: any) {
    console.error('[EInvoiceAPI] Error:', error)
    return NextResponse.json(createErrorResponse(error.message || 'Lỗi hệ thống', 'SERVER_ERROR'), { status: 500 })
  }
}
