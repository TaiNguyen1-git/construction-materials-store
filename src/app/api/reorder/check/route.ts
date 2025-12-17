/**
 * API endpoint to check inventory and send reorder alerts to suppliers
 * Can be called manually or via cron job
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReorderAlertService } from '@/lib/reorder-alert-service'
import { requireManager } from '@/lib/auth-middleware-api'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// POST /api/reorder/check - Trigger reorder check and send emails
export async function POST(request: NextRequest) {
    try {
        // Require manager role
        const authError = requireManager(request)
        if (authError) {
            return authError
        }

        const result = await ReorderAlertService.checkAndAlert()

        return NextResponse.json(
            createSuccessResponse({
                alertsGenerated: result.alerts.length,
                emailsSent: result.emailsSent,
                alerts: result.alerts,
                errors: result.errors
            }, `Đã kiểm tra ${result.alerts.length} sản phẩm sắp hết, gửi ${result.emailsSent} email`),
            { status: 200 }
        )
    } catch (error) {
        console.error('Reorder check failed:', error)
        return NextResponse.json(
            createErrorResponse('Failed to check reorder', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}

// GET /api/reorder/check - Get low stock items without sending emails
export async function GET(request: NextRequest) {
    try {
        const authError = requireManager(request)
        if (authError) {
            return authError
        }

        const alerts = await ReorderAlertService.getLowStockProducts()

        return NextResponse.json(
            createSuccessResponse({
                count: alerts.length,
                alerts
            }, `Có ${alerts.length} sản phẩm cần bổ sung`),
            { status: 200 }
        )
    } catch (error) {
        console.error('Get low stock failed:', error)
        return NextResponse.json(
            createErrorResponse('Failed to get low stock', 'SERVER_ERROR'),
            { status: 500 }
        )
    }
}
