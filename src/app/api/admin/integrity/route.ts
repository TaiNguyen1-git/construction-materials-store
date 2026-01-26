/**
 * API: Admin Integrity Dashboard
 * GET /api/admin/integrity/dashboard - Get overview stats
 * GET /api/admin/integrity/alerts - Get suspicious activities
 * PATCH /api/admin/integrity/alerts/[id] - Resolve alert
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const view = searchParams.get('view') || 'dashboard'

        if (view === 'dashboard') {
            // Get overall integrity stats
            const [
                pendingKYC,
                openAlerts,
                activeRestrictions,
                recentAuditLogs,
                alertsBySeverity,
                restrictionsByType
            ] = await Promise.all([
                // Pending KYC documents
                prisma.kYCDocument.count({
                    where: { status: 'PENDING' }
                }),

                // Open suspicious activities
                prisma.suspiciousActivity.count({
                    where: { status: { in: ['OPEN', 'INVESTIGATING'] } }
                }),

                // Active user restrictions
                prisma.userRestriction.count({
                    where: {
                        isActive: true,
                        OR: [
                            { endDate: null },
                            { endDate: { gt: new Date() } }
                        ]
                    }
                }),

                // Recent audit logs (last 24h)
                prisma.auditLog.count({
                    where: {
                        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    }
                }),

                // Alerts by severity
                prisma.suspiciousActivity.groupBy({
                    by: ['severity'],
                    where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
                    _count: true
                }),

                // Restrictions by type
                prisma.userRestriction.groupBy({
                    by: ['type'],
                    where: { isActive: true },
                    _count: true
                })
            ])

            return NextResponse.json(createSuccessResponse({
                overview: {
                    pendingKYC,
                    openAlerts,
                    activeRestrictions,
                    recentAuditLogs
                },
                alertsBySeverity: alertsBySeverity.reduce((acc, item) => {
                    acc[item.severity] = item._count
                    return acc
                }, {} as Record<string, number>),
                restrictionsByType: restrictionsByType.reduce((acc, item) => {
                    acc[item.type] = item._count
                    return acc
                }, {} as Record<string, number>)
            }))
        }

        if (view === 'alerts') {
            const severity = searchParams.get('severity')
            const status = searchParams.get('status')
            const type = searchParams.get('type')
            const limit = parseInt(searchParams.get('limit') || '50')

            const alerts = await prisma.suspiciousActivity.findMany({
                where: {
                    ...(severity && { severity: severity as any }),
                    ...(status && { status: status as any }),
                    ...(type && { activityType: type as any })
                },
                orderBy: [
                    { severity: 'desc' },
                    { createdAt: 'desc' }
                ],
                take: limit
            })

            return NextResponse.json(createSuccessResponse({ alerts }))
        }

        if (view === 'kyc-queue') {
            const status = searchParams.get('status') || 'PENDING'

            const documents = await prisma.kYCDocument.findMany({
                where: { status: status as any },
                orderBy: { createdAt: 'asc' },
                take: 50
            })

            // Get customer info for each document
            const customerIds = documents.map(d => d.customerId)
            const customers = await prisma.customer.findMany({
                where: { id: { in: customerIds } },
                include: {
                    user: { select: { name: true, email: true, phone: true } },
                    contractorProfile: { select: { displayName: true, isVerified: true } }
                }
            })

            const customerMap = new Map(customers.map(c => [c.id, c]))

            const enrichedDocs = documents.map(doc => ({
                ...doc,
                customer: customerMap.get(doc.customerId)
            }))

            return NextResponse.json(createSuccessResponse({ documents: enrichedDocs }))
        }

        if (view === 'restrictions') {
            const customerId = searchParams.get('customerId')
            const activeOnly = searchParams.get('active') !== 'false'

            const restrictions = await prisma.userRestriction.findMany({
                where: {
                    ...(customerId && { customerId }),
                    ...(activeOnly && {
                        isActive: true,
                        OR: [
                            { endDate: null },
                            { endDate: { gt: new Date() } }
                        ]
                    })
                },
                orderBy: { createdAt: 'desc' },
                take: 100
            })

            return NextResponse.json(createSuccessResponse({ restrictions }))
        }

        if (view === 'audit-logs') {
            const entityType = searchParams.get('entityType')
            const entityId = searchParams.get('entityId')
            const action = searchParams.get('action')
            const actorId = searchParams.get('actorId')
            const limit = parseInt(searchParams.get('limit') || '100')

            const logs = await prisma.auditLog.findMany({
                where: {
                    ...(entityType && { entityType }),
                    ...(entityId && { entityId }),
                    ...(action && { action: action as any }),
                    ...(actorId && { actorId })
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            })

            return NextResponse.json(createSuccessResponse({ logs }))
        }

        return NextResponse.json(createErrorResponse('Invalid view parameter', 'BAD_REQUEST'), { status: 400 })

    } catch (error: any) {
        console.error('Integrity dashboard error:', error)
        return NextResponse.json(
            createErrorResponse('Internal server error', 'INTERNAL_ERROR'),
            { status: 500 }
        )
    }
}
