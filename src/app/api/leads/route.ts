/**
 * Lead API
 * POST: Save customer contact info and return Zalo contact URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, phone, email, projectType, estimateData, estimateId } = body

        // If no basic contact info provided but they clicked, we still want to provide the Zalo link
        // But we won't create a 'Lead' record if it's completely empty to avoid spamming the DB with empty rows
        if (!name && !phone && !email) {
            const zaloUrl = `https://zalo.me/${process.env.NEXT_PUBLIC_CONTACT_PHONE}`
            return NextResponse.json({ success: true, zaloUrl })
        }

        // Save Lead to Database
        const lead = await prisma.lead.create({
            data: {
                name: name || 'Khách vãng lai',
                phone: phone || null,
                email: email || null,
                projectType: projectType || 'Chưa xác định',
                estimateData: estimateData || null,
                notes: estimateId ? `Estimate ID: ${estimateId}` : null,
                source: 'AI_ESTIMATOR_WEB',
            }
        })

        // Construct Zalo URL with a personalized message
        // This makes it easier for the business to identify the customer context
        let message = `Chào SmartBuild, tôi là ${name || 'khách hàng'}.`
        if (projectType && projectType !== 'Chưa xác định') {
            message += ` Tôi vừa sử dụng AI Estimator cho dự án ${projectType}.`
        }
        message += ` Tôi cần tư vấn thêm về khối lượng vật tư này.`

        const zaloUrl = `https://zalo.me/${process.env.NEXT_PUBLIC_CONTACT_PHONE}?text=${encodeURIComponent(message)}`

        return NextResponse.json({
            success: true,
            data: lead,
            zaloUrl
        })

    } catch (error: any) {
        console.error('Lead API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
