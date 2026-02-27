import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Haversine formula to calculate distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
}

interface WorkerReportWithRelations {
    id: string;
    photoUrl: string;
    lat: number | null;
    lng: number | null;
    pHash: string | null;
    imageHash: string | null;
    workerName: string;
    createdAt: Date;
    projectId: string;
    project: {
        lat: number | null;
        lng: number | null;
        title: string;
    };
    contractor: {
        user: {
            name: string;
            email: string;
        };
    };
}

export async function GET(request: NextRequest) {
    try {
        // 1. Fetch all worker reports with project geo-data
        const reports = await prisma.workerReport.findMany({
            include: {
                project: true,
                contractor: {
                    select: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 200 // Limit for audit
        }) as unknown as WorkerReportWithRelations[]

        const flaggedReports = []

        // 2. Identify GPS Fraud (Distance > 300m)
        for (const report of reports) {
            let isFlagged = false
            const fraudType: string[] = []
            let fraudDetails = ""

            // GPS Check
            if (report.lat && report.lng && report.project.lat && report.project.lng) {
                const distance = getDistance(report.lat, report.lng, report.project.lat, report.project.lng)
                if (distance > 300) {
                    isFlagged = true
                    fraudType.push('GPS_MISMATCH')
                    fraudDetails += `Cách công trình ${Math.round(distance)}m. `
                }
            }

            // pHash Check (Visual Similarity)
            if (report.pHash) {
                const similar = reports.find((r) => r.id !== report.id && r.pHash === report.pHash)
                if (similar) {
                    isFlagged = true
                    fraudType.push('VISUAL_DUPLICATE')
                    fraudDetails += `Ảnh trùng lặp với báo cáo #${similar.id.slice(-4)}. `
                }
            }

            // Exact Hash Check
            if (report.imageHash) {
                const identical = reports.find((r) => r.id !== report.id && r.imageHash === report.imageHash)
                if (identical) {
                    isFlagged = true
                    fraudType.push('EXACT_DUPLICATE')
                    fraudDetails += `Ảnh hoàn toàn trùng khớp với báo cáo #${identical.id.slice(-4)}. `
                }
            }

            if (isFlagged) {
                flaggedReports.push({
                    ...report,
                    // Flatten contractor for frontend compatibility
                    contractor: {
                        name: report.contractor?.user?.name || 'N/A',
                        email: report.contractor?.user?.email || 'N/A'
                    },
                    fraudType,
                    fraudDetails,
                    riskScore: fraudType.length * 40 // simple scoring
                })
            }
        }

        return NextResponse.json({ success: true, data: flaggedReports })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { reportId, status, rejectionReason } = body

        if (!reportId || !status) {
            return NextResponse.json({ error: 'Missing reportId or status' }, { status: 400 })
        }

        const updated = await prisma.workerReport.update({
            where: { id: reportId },
            data: {
                status: status as string,
                rejectionReason: rejectionReason as string | null,
                customerStatus: (status === 'REJECTED' ? 'DISPUTED' : 'APPROVED') as string
            }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
