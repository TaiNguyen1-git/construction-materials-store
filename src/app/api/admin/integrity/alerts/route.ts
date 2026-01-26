/**
 * API: Suspicious Activity Alerts Management
 * GET /api/admin/integrity/alerts - Get alerts
 * PATCH /api/admin/integrity/alerts - Resolve alert
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { AnomalyDetectionService } from '@/lib/anomaly-detection-service'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const severity = searchParams.get('severity')
        const status = searchParams.get('status')
        const type = searchParams.get('type')
        const limit = parseInt(searchParams.get('limit') || '50')

        const alerts = await AnomalyDetectionService.getPendingAlerts({
            severity: severity as any,
            type: type as any,
            limit
        })

        // Get stats
        const stats = await prisma.suspiciousActivity.groupBy({
            by: ['severity', 'status'],
            _count: true
        })

        return NextResponse.json(createSuccessResponse({
            alerts,
            stats: stats.reduce((acc, item) => {
                const key = `${item.severity}_${item.status}`
                acc[key] = item._count
                return acc
            }, {} as Record<string, number>)
        }))

    } catch (error: any) {
        console.error('Get alerts error:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id')
        if (!userId) {
            return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })
        }

        const body = await request.json()
        const { alertId, action, resolution, applyRestriction, restrictionType, restrictionReason } = body

        if (!alertId || !action) {
            return NextResponse.json(
                createErrorResponse('Missing alertId or action', 'BAD_REQUEST'),
                { status: 400 }
            )
        }

        const alert = await prisma.suspiciousActivity.findUnique({
            where: { id: alertId }
        })

        if (!alert) {
            return NextResponse.json(createErrorResponse('Alert not found', 'NOT_FOUND'), { status: 404 })
        }

        let status: 'RESOLVED' | 'FALSE_POSITIVE' | 'ESCALATED' | 'INVESTIGATING' = 'RESOLVED'

        if (action === 'RESOLVE') {
            status = 'RESOLVED'
        } else if (action === 'FALSE_POSITIVE') {
            status = 'FALSE_POSITIVE'
        } else if (action === 'ESCALATE') {
            status = 'ESCALATED'
        } else if (action === 'INVESTIGATE') {
            status = 'INVESTIGATING'
        }

        // Resolve the alert
        await AnomalyDetectionService.resolveAlert(
            alertId,
            userId,
            resolution || `Resolved as ${status}`,
            status
        )

        // Optionally apply restriction to linked users
        if (applyRestriction && alert.customerId && restrictionType) {
            const { RestrictionService } = await import('@/lib/restriction-service')

            const admin = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true }
            })

            await RestrictionService.applyRestriction(
                alert.customerId,
                restrictionType,
                {
                    reason: restrictionReason || `Áp dụng do cảnh báo: ${alert.activityType}`,
                    evidence: { alertId, alertType: alert.activityType },
                    imposedBy: userId,
                    imposedByName: admin?.name
                }
            )
        }

        return NextResponse.json(
            createSuccessResponse({ success: true }, `Alert marked as ${status}`)
        )

    } catch (error: any) {
        console.error('Resolve alert error:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
