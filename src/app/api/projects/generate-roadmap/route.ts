import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIG } from '@/lib/ai-config'

const genAI = new GoogleGenerativeAI(AI_CONFIG.GEMINI.API_KEY)

// POST /api/projects/generate-roadmap - Generate AI roadmap for an estimate
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { estimateId, projectType, area, materials, startDate } = body

        if (!estimateId || !materials || !Array.isArray(materials)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Generate phases using AI
        const model = genAI.getGenerativeModel({ model: AI_CONFIG.GEMINI.MODEL })

        const prompt = `
Bạn là chuyên gia quản lý dự án xây dựng. Hãy tạo lộ trình thi công cho dự án sau:

**Thông tin dự án:**
- Loại: ${projectType}
- Diện tích: ${area} m²
- Ngày bắt đầu dự kiến: ${startDate || 'Chưa xác định'}
- Vật liệu đã dự toán: ${materials.map((m: any) => `${m.productName || m.name} (${m.quantity} ${m.unit})`).join(', ')}

**Yêu cầu:**
Tạo danh sách các giai đoạn thi công (từ 3-6 giai đoạn) theo định dạng JSON:
[
  {
    "name": "Tên giai đoạn",
    "description": "Mô tả ngắn gọn công việc",
    "order": 1,
    "durationDays": 7,
    "materials": ["tên vật liệu 1", "tên vật liệu 2"],
    "purchaseLeadDays": 3
  }
]

Lưu ý:
- Sắp xếp theo thứ tự thi công hợp lý
- Mỗi giai đoạn liệt kê vật liệu cần mua
- purchaseLeadDays: số ngày cần đặt hàng trước khi bắt đầu giai đoạn
- Chỉ trả về JSON array, không có text khác
`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Parse AI response
        let phases: any[] = []
        try {
            // Extract JSON from response
            const jsonMatch = responseText.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                phases = JSON.parse(jsonMatch[0])
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError)
            // Fallback to default phases
            phases = generateDefaultPhases(projectType)
        }

        // Calculate dates and save phases
        const baseDate = startDate ? new Date(startDate) : new Date()
        let currentDate = new Date(baseDate)

        const createdPhases = []
        for (const phase of phases) {
            const estimatedStartDate = new Date(currentDate)
            const estimatedEndDate = new Date(currentDate)
            estimatedEndDate.setDate(estimatedEndDate.getDate() + (phase.durationDays || 7))

            const purchaseDeadline = new Date(estimatedStartDate)
            purchaseDeadline.setDate(purchaseDeadline.getDate() - (phase.purchaseLeadDays || 3))

            // Match materials from estimate
            const recommendedMaterials = materials
                .filter((m: any) => {
                    const matName = (m.productName || m.name || '').toLowerCase()
                    return phase.materials?.some((pm: string) =>
                        matName.includes(pm.toLowerCase()) || pm.toLowerCase().includes(matName)
                    )
                })
                .map((m: any) => ({
                    productId: m.productId,
                    name: m.productName || m.name,
                    quantity: m.quantity,
                    unit: m.unit,
                    priority: 'HIGH'
                }))

            const createdPhase = await (prisma as any).projectPhase.create({
                data: {
                    estimateId,
                    name: phase.name,
                    description: phase.description,
                    order: phase.order,
                    status: 'PENDING',
                    estimatedStartDate,
                    estimatedEndDate,
                    purchaseDeadline,
                    recommendedMaterials,
                    completionPercent: 0
                }
            })

            createdPhases.push(createdPhase)

            // Create reminder for material purchase
            if (recommendedMaterials.length > 0) {
                await (prisma as any).projectReminder.create({
                    data: {
                        estimateId,
                        title: `Đặt vật tư cho giai đoạn "${phase.name}"`,
                        message: `Bạn nên đặt mua ${recommendedMaterials.map((m: any) => m.name).join(', ')} trước ngày ${purchaseDeadline.toLocaleDateString('vi-VN')} để kịp tiến độ.`,
                        type: 'MATERIAL_PURCHASE',
                        priority: 'HIGH',
                        scheduledFor: purchaseDeadline,
                        phaseId: createdPhase.id,
                        productIds: recommendedMaterials.map((m: any) => m.productId).filter(Boolean)
                    }
                })
            }

            // Move to next phase
            currentDate = new Date(estimatedEndDate)
            currentDate.setDate(currentDate.getDate() + 1)
        }

        return NextResponse.json({
            success: true,
            phases: createdPhases,
            message: `Đã tạo ${createdPhases.length} giai đoạn cho dự án`
        })

    } catch (error) {
        console.error('Error generating roadmap:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// GET /api/projects/generate-roadmap?estimateId=xxx - Get phases for an estimate
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const estimateId = searchParams.get('estimateId')

        if (!estimateId) {
            return NextResponse.json({ error: 'Missing estimateId' }, { status: 400 })
        }

        const phases = await (prisma as any).projectPhase.findMany({
            where: { estimateId },
            orderBy: { order: 'asc' }
        })

        const reminders = await (prisma as any).projectReminder.findMany({
            where: {
                estimateId,
                isDismissed: false
            },
            orderBy: { scheduledFor: 'asc' }
        })

        return NextResponse.json({
            phases,
            reminders,
            upcomingReminders: reminders.filter((r: any) =>
                new Date(r.scheduledFor) > new Date() && !r.isRead
            )
        })

    } catch (error) {
        console.error('Error fetching roadmap:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Default phases fallback
function generateDefaultPhases(projectType: string) {
    const defaultPhases: Record<string, any[]> = {
        flooring: [
            { name: 'Chuẩn bị mặt bằng', description: 'Dọn dẹp, san phẳng nền', order: 1, durationDays: 2, materials: ['xi măng', 'cát'], purchaseLeadDays: 2 },
            { name: 'Láng nền', description: 'Đổ lớp bê tông lót', order: 2, durationDays: 3, materials: ['xi măng', 'cát', 'đá'], purchaseLeadDays: 3 },
            { name: 'Lát gạch', description: 'Lát gạch hoàn thiện', order: 3, durationDays: 5, materials: ['gạch', 'keo dán'], purchaseLeadDays: 5 }
        ],
        painting: [
            { name: 'Xử lý bề mặt', description: 'Trám trét, đánh nhám', order: 1, durationDays: 2, materials: ['bột trét', 'giấy nhám'], purchaseLeadDays: 2 },
            { name: 'Sơn lót', description: 'Sơn lớp lót chống kiềm', order: 2, durationDays: 2, materials: ['sơn lót'], purchaseLeadDays: 3 },
            { name: 'Sơn hoàn thiện', description: 'Sơn 2 lớp phủ', order: 3, durationDays: 3, materials: ['sơn phủ'], purchaseLeadDays: 3 }
        ],
        general: [
            { name: 'Chuẩn bị', description: 'Khảo sát, lên kế hoạch', order: 1, durationDays: 3, materials: [], purchaseLeadDays: 2 },
            { name: 'Thi công thô', description: 'Công việc xây dựng chính', order: 2, durationDays: 14, materials: ['xi măng', 'gạch', 'thép'], purchaseLeadDays: 7 },
            { name: 'Hoàn thiện', description: 'Sơn, ốp lát, lắp đặt', order: 3, durationDays: 7, materials: ['sơn', 'gạch ốp'], purchaseLeadDays: 5 }
        ]
    }

    return defaultPhases[projectType] || defaultPhases.general
}
