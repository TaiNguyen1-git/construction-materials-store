/**
 * AI Service API - Powered by Gemini
 * General purpose writing assistant for contractors, owners, and staff
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// Simple check for API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(request: NextRequest) {
    try {
        const { prompt, context, type, projectId } = await request.json()

        let enrichedContext = { ...context }

        // Fetch Real Data if it's bidding advice or product upsell
        if ((type === 'BIDDING_ADVICE' || type === 'PRODUCT_UPSELL') && projectId) {
            const project = await prisma.constructionProject.findUnique({
                where: { id: projectId },
                select: { estimatedBudget: true, title: true, description: true }
            })

            // Get top products or discounted products from store
            const featuredProducts = await prisma.product.findMany({
                where: { isActive: true },
                take: 5,
                select: { name: true, price: true, unit: true, category: { select: { name: true } } }
            })

            const otherApplications = await prisma.projectApplication.findMany({
                where: { projectId, status: { not: 'REJECTED' } },
                select: { proposedBudget: true }
            })

            const bids = otherApplications.map(a => a.proposedBudget).filter(b => b !== null) as number[]
            const avgBid = bids.length > 0
                ? bids.reduce((a, b) => a + b, 0) / bids.length
                : (project?.estimatedBudget || 0)

            enrichedContext.avgPrice = avgBid
            enrichedContext.bidCount = bids.length
            enrichedContext.estimatedBudget = project?.estimatedBudget || 0
            enrichedContext.featuredProducts = featuredProducts
            enrichedContext.projectTitle = project?.title
            enrichedContext.projectDesc = project?.description
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: buildSystemPrompt(type, enrichedContext) + "\n\nUser Input/Requirement: " + prompt
                    }]
                }]
            })
        })

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không thể tạo nội dung."

        return NextResponse.json(createSuccessResponse({ text, isMock: false }))
    } catch (error) {
        console.error('AI Service Error:', error)
        return NextResponse.json(createErrorResponse('Lỗi kết nối AI', 'SERVER_ERROR'), { status: 500 })
    }
}

function buildSystemPrompt(type: string, context: any) {
    switch (type) {
        case 'PROJECT_DESCRIPTION':
            return `Bạn là chuyên gia tư vấn xây dựng. Hãy giúp chủ nhà viết một mô tả dự án chuyên nghiệp, chi tiết dựa trên các từ khóa người dùng cung cấp. Bao gồm các mục: Quy mô, Phong cách, Hạng mục chi tiết, Yêu cầu vật tư. Ngôn ngữ: Tiếng Việt.`
        case 'BIDDING_PROPOSAL':
            return `Bạn là trợ lý đấu thầu cho nhà thầu xây dựng. Hãy viết một thư ứng tuyển thuyết phục dựa trên kinh nghiệm của thợ: ${context?.experience || 'nhiều năm'} và yêu cầu dự án: ${context?.projectTitle || ''}. Văn phong chuyên nghiệp, tin cậy. Ngôn ngữ: Tiếng Việt.`
        case 'BIDDING_ADVICE':
            const price = context?.proposedPrice || 0
            const avg = context?.avgPrice || 0
            const budget = context?.estimatedBudget || 0
            const bidCount = context?.bidCount || 0

            return `Bạn là chuyên gia phân tích thị trường xây dựng. Hãy đưa ra lời khuyên chiến lược cho nhà thầu. 
            Dữ liệu thực tế: 
            - Giá nhà thầu định báo: ${price.toLocaleString()}đ
            - Ngân sách chủ nhà: ${budget > 0 ? budget.toLocaleString() + 'đ' : 'Thỏa thuận'}
            - Đối thủ báo giá trung bình: ${avg > 0 ? avg.toLocaleString() + 'đ' : 'Chưa có'}
            
            Nhiệm vụ: Phân tích tính cạnh tranh và đưa ra 3 lời khuyên. Ngôn ngữ: Tiếng Việt.`

        case 'PRODUCT_UPSELL':
            const productsUpsell = context?.featuredProducts || []
            const descUpsell = context?.projectDesc || ''
            return `Bạn là tư vấn viên cửa hàng Vật Liệu Xây Dựng. Dựa trên dự án: "${descUpsell}", hãy chọn ra 2-3 sản phẩm phù hợp nhất từ danh sách của cửa hàng:
            ${productsUpsell.map((p: any) => `- ${p.name} (${p.price.toLocaleString()}đ/${p.unit})`).join('\n')}
            
            Hãy viết một đoạn ngắn gợi ý nhà thầu nên Đưa Các Sản Phẩm Này vào báo giá để tăng độ chuyên nghiệp và được hưởng chiết khấu 5% cho Verified Partner. Ngôn ngữ: Tiếng Việt.`

        case 'OWNER_MATERIAL_STANDARDS':
            const productsOwner = context?.featuredProducts || []
            const titleOwner = context?.projectTitle || ''
            return `Bạn là kỹ sư tư vấn giám sát cho chủ nhà. Dự án: "${titleOwner}".
            Dựa trên danh sách vật tư sẵn có:
            ${productsOwner.map((p: any) => `- ${p.name} (${p.category?.name || 'Vật tư'})`).join('\n')}
            
            Hãy soạn một đoạn tin nhắn ngắn (max 100 từ) tư vấn cho chủ nhà 3 loại vật tư CHỐT CHẶN quan trọng nên yêu cầu nhà thầu sử dụng từ SmartBuild để đảm bảo chất lượng công trình và dễ kiểm soát giá. Ngôn ngữ: Tiếng Việt.`
        default:
            return `Bạn là trợ lý thông minh trong ứng dụng quản lý xây dựng SmartBuild. Hãy hỗ trợ người dùng viết văn bản chuyên nghiệp.`
    }
}

function getMockResponse(type: string, context: any) {
    // Fallback logic when no API key
    if (type === 'BIDDING_ADVICE') {
        const price = context?.proposedPrice || 0
        const avg = context?.avgPrice || 50000000
        if (price > avg * 1.2) return "Giá của bạn hơi cao hơn mặt bằng chung. Hãy nhấn mạnh vào chất lượng vật tư cao cấp hoặc bảo hành dài hạn."
        return "Báo giá của bạn khá cạnh tranh. Hãy tập trung vào việc bạn đã có chứng chỉ 'Verified Partner' để chủ nhà yên tâm."
    }
    return "Đây là phản hồi mẫu từ hệ thống. (Vui lòng cấu hình GEMINI_API_KEY để sử dụng AI thật)"
}
