import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { verifyTokenFromRequest } from '@/lib/auth-middleware-api'

export async function POST(request: NextRequest) {
    try {
        const payload = verifyTokenFromRequest(request)
        if (!payload?.userId) return NextResponse.json(createErrorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 401 })

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { customer: true }
        })

        if (!user || !user.customer) {
            return NextResponse.json(createErrorResponse('Profile not found', 'NOT_FOUND'), { status: 404 })
        }

        const body = await request.json()
        const { projectId, milestoneId, photoUrl, workerName, notes, imageHash, pHash, lat, lng, takenAt } = body

        if (!projectId || !photoUrl) {
            return NextResponse.json(createErrorResponse('Project ID and Photo URL are required', 'VALIDATION_ERROR'), { status: 400 })
        }

        // --- AI Anti-Fraud & Verification ---
        let fraudDetectedReason = ''
        let distanceCalculated = 0

        // 1. Get Project context for location check
        const project = await prisma.constructionProject.findUnique({
            where: { id: projectId },
            // @ts-ignore
            select: { lat: true, lng: true, title: true }
        })

        // 2. GPS Verification (Check if photo was taken at the site)
        // @ts-ignore
        if (project?.lat && project?.lng && lat && lng) {
            const R = 6371e3 // Earth radius in meters
            // @ts-ignore
            const φ1 = (project.lat * Math.PI) / 180
            const φ2 = (lat * Math.PI) / 180
            // @ts-ignore
            const Δφ = ((lat - project.lat) * Math.PI) / 180
            // @ts-ignore
            const Δλ = ((lng - project.lng) * Math.PI) / 180

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            distanceCalculated = R * c // distance in meters

            if (distanceCalculated > 300) { // Limit to 300m radius
                return NextResponse.json(createErrorResponse(
                    `Vị trí chụp ảnh không khớp với công trình (${Math.round(distanceCalculated)}m). Vui lòng chụp tại công trường.`,
                    'LOCATION_MISMATCH'
                ), { status: 400 })
            }
        }

        // 3. Duplicate Detection (Strict Hash & Visual pHash)
        if (imageHash || pHash) {
            const existingReport = await prisma.workerReport.findFirst({
                where: {
                    projectId,
                    OR: [
                        imageHash ? { imageHash } : {},
                        // @ts-ignore
                        pHash ? { pHash } : {}
                    ]
                }
            })

            if (existingReport) {
                const reason = existingReport.imageHash === imageHash ? 'ảnh cũ' : 'ảnh quá giống ảnh cũ'
                fraudDetectedReason = `Hình ảnh này đã được sử dụng (${reason}).`
                return NextResponse.json(createErrorResponse(
                    `Phát hiện gian lận: ${fraudDetectedReason}`,
                    'FRAUD_DETECTED'
                ), { status: 400 })
            }
        }
        // ---------------------------

        const report = await prisma.workerReport.create({
            data: {
                projectId,
                milestoneId: milestoneId || null,
                contractorId: user.customer.id,
                photoUrl,
                imageHash: imageHash || null,
                // @ts-ignore
                pHash: pHash || null,
                // @ts-ignore
                lat: lat ? parseFloat(lat) : null,
                // @ts-ignore
                lng: lng ? parseFloat(lng) : null,
                takenAt: takenAt ? new Date(takenAt) : null,
                workerName: workerName || user.name || 'Nhà thầu',
                notes: notes || '',
                status: 'APPROVED',
                customerStatus: 'PENDING'
            }
        })

        // --- Post-creation Notifications & Alerts ---
        import('@/lib/notification-service').then(async ({ saveNotificationForAllManagers }) => {
            // 1. Check for Fraud to alert managers
            let fraudAlertMessage = null
            if (distanceCalculated && distanceCalculated > 300) {
                fraudAlertMessage = `Cảnh báo gian lận GPS: Báo cáo từ ${workerName || user.name} tại dự án ${project?.title} sai lệch ${Math.round(distanceCalculated)}m.`
            } else if (fraudDetectedReason) {
                fraudAlertMessage = `Cảnh báo gian lận hình ảnh: Báo cáo từ ${workerName || user.name} tại dự án ${project?.title}. ${fraudDetectedReason}`
            }

            if (fraudAlertMessage) {
                await saveNotificationForAllManagers({
                    type: 'FRAUD_ALERT',
                    priority: 'HIGH',
                    title: '⚠️ Phát hiện gian lận',
                    message: fraudAlertMessage,
                    data: { reportId: report.id, projectId, workerName: workerName || user.name }
                })
            }
        }).catch(err => console.error('Notification service error:', err))

        return NextResponse.json(createSuccessResponse(report, 'Đã gửi báo cáo thành công'))
    } catch (error: any) {
        console.error('Report Creation Error:', error)
        return NextResponse.json(createErrorResponse(error.message, 'SERVER_ERROR'), { status: 500 })
    }
}
