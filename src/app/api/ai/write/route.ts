/**
 * AI Service API - Powered by Gemini
 * General purpose writing assistant for contractors, owners, and staff
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'

// Initialize Gemini client (same as ai-vision-estimator)
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null

// Retry helper
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try { return await fn() } catch (e) { if (i === maxRetries - 1) throw e; await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))) }
    }
    throw new Error('Retry failed')
}

export async function POST(request: NextRequest) {
    try {
        const { prompt, context, type, projectId } = await request.json()

        const enrichedContext = { ...context }

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

        // Check if SDK is configured
        if (!genAI) {
            console.log('[AI] GEMINI_API_KEY not configured, using mock response')
            const mockText = getMockResponse(type, enrichedContext)
            return NextResponse.json(createSuccessResponse({ text: mockText, isMock: true }))
        }

        // Use the same model fallback chain as ai-vision-estimator
        const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash']
        let lastError: any = null
        let responseText = ''

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName })
                const aiPrompt = buildSystemPrompt(type, enrichedContext) + "\n\nUser Input/Requirement: " + prompt

                const result = await withRetry(() => model.generateContent(aiPrompt)) as any
                responseText = result.response.text()

                if (responseText) {
                    console.log(`[AI] Success with model: ${modelName}`)
                    break
                }
            } catch (err) {
                console.error(`[AI] Model ${modelName} failed, trying fallback...`, err)
                lastError = err
                continue
            }
        }

        if (!responseText) {
            console.log('[AI] All models failed, using mock response')
            const mockText = getMockResponse(type, enrichedContext)
            return NextResponse.json(createSuccessResponse({ text: mockText, isMock: true }))
        }

        return NextResponse.json(createSuccessResponse({ text: responseText, isMock: false }))
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
            const contractorName = context?.contractorName || 'Nhà thầu'
            const yearsExp = context?.yearsExperience || 'nhiều năm'
            const specialties = context?.specialties || 'xây dựng'
            const completedProjects = context?.completedProjects || 0
            const rating = context?.rating || 0
            const isVerified = context?.isVerified || false
            const isGuest = context?.isGuest || false
            const bio = context?.bio || ''

            let profileInfo = ''
            if (isGuest) {
                profileInfo = `Tên: ${contractorName} (Hồ sơ tự khai báo)`
            } else {
                profileInfo = `
                - Tên/Công ty: ${contractorName}
                - Kinh nghiệm: ${yearsExp} năm
                - Chuyên môn: ${specialties}
                - Dự án đã hoàn thành: ${completedProjects > 0 ? completedProjects + ' dự án' : 'Đang cập nhật'}
                - Đánh giá: ${rating > 0 ? rating + '/5 sao' : 'Chưa có'}
                - Trạng thái: ${isVerified ? 'Đã xác minh trên SmartBuild' : 'Chưa xác minh'}
                ${bio ? '- Giới thiệu: ' + bio.substring(0, 200) : ''}
                `
            }

            return `Bạn là trợ lý đấu thầu chuyên nghiệp. Hãy viết một thư ứng tuyển NGẮN GỌN (tối đa 150 từ) cho dự án: "${context?.projectTitle || 'dự án xây dựng'}".

THÔNG TIN NHÀ THẦU:
${profileInfo}

YÊU CẦU:
- Văn phong chuyên nghiệp, tự tin nhưng không khoe khoang
- Đề cập đến kinh nghiệm thực tế (nếu có)
- Cam kết chất lượng và tiến độ
- KHÔNG bịa thêm thông tin không có trong profile
- Kết thúc bằng lời mời liên hệ

Ngôn ngữ: Tiếng Việt.`
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
    // Fallback logic when no API key - provide useful mock responses
    switch (type) {
        case 'BIDDING_PROPOSAL':
            const projectTitle = context?.projectTitle || 'dự án'
            const name = context?.contractorName || 'tôi'
            const years = context?.yearsExperience || 'nhiều năm'
            const skills = context?.specialties || 'xây dựng, hoàn thiện'
            const projects = context?.completedProjects || 0
            const verified = context?.isVerified
            const isGuest = context?.isGuest

            if (isGuest) {
                return `Kính gửi Quý Chủ đầu tư,

Tôi là ${name}, hiện đang hoạt động trong lĩnh vực ${skills}. Sau khi xem xét yêu cầu của "${projectTitle}", tôi xin gửi đến Quý vị lời đề nghị hợp tác.

**Cam kết của tôi:**
• Thi công đúng tiến độ, đảm bảo chất lượng
• Sử dụng vật tư chính hãng, có nguồn gốc rõ ràng
• Báo giá minh bạch, không phát sinh

Rất mong có cơ hội được trao đổi thêm với Quý Chủ đầu tư.

Trân trọng,
${name}`
            }

            return `Kính gửi Quý Chủ đầu tư,

Tôi là ${name}${verified ? ' - Đối tác xác minh trên SmartBuild' : ''}. Với ${years} năm kinh nghiệm trong lĩnh vực ${skills}, ${projects > 0 ? `đã hoàn thành ${projects}+ dự án tương tự, ` : ''}tôi xin gửi đến Quý vị lời đề nghị hợp tác cho dự án "${projectTitle}".

**Năng lực của chúng tôi:**
• Đội ngũ thợ lành nghề, được đào tạo chuyên môn
• Vật tư nhập từ SmartBuild - đảm bảo chất lượng và giá tốt
• Cam kết tiến độ và bảo hành công trình 12-24 tháng

Rất mong được hợp tác cùng Quý Chủ đầu tư.

Trân trọng,
${name}`

        case 'BIDDING_ADVICE':
            const price = context?.proposedPrice || 0
            const avg = context?.avgPrice || 50000000
            const budget = context?.estimatedBudget || 0

            if (price > avg * 1.2) {
                return `📊 **Phân tích báo giá:**
                
Giá bạn đưa ra cao hơn mức trung bình ~${Math.round((price / avg - 1) * 100)}%. Để tăng khả năng trúng thầu:
1. Nhấn mạnh chất lượng vật tư cao cấp từ SmartBuild
2. Đưa ra bảo hành dài hạn 24 tháng
3. Cam kết tiến độ rõ ràng với penalty clause`
            }
            if (budget > 0 && price < budget * 0.8) {
                return `📊 **Phân tích báo giá:**

Giá của bạn thấp hơn ngân sách chủ nhà ~${Math.round((1 - price / budget) * 100)}%. Điều này rất cạnh tranh! Lưu ý:
1. Đảm bảo biên lợi nhuận hợp lý
2. Có thể đề xuất thêm gói vật tư cao cấp
3. Nêu bật việc bạn là Verified Partner của SmartBuild`
            }
            return `📊 **Phân tích báo giá:**

Báo giá của bạn nằm trong mức cạnh tranh. Để nổi bật hơn:
1. Đính kèm portfolio các dự án tương tự
2. Nhấn mạnh chứng chỉ 'Verified Partner' của SmartBuild
3. Cam kết sử dụng vật tư chính hãng từ hệ thống`

        case 'PRODUCT_UPSELL':
            return `💡 **Gợi ý vật tư tối ưu:**

Dựa trên yêu cầu dự án, chúng tôi đề xuất:
• **Xi măng Fico PCB40** - Chất lượng cao, phù hợp công trình dân dụng
• **Gạch men Viglacera 60x60** - Bền đẹp, dễ vệ sinh
• **Sơn Dulux Weathershield** - Chống thấm, bền màu 5 năm

🎁 Đối tác Verified được giảm 5% khi đặt qua SmartBuild!`

        case 'OWNER_MATERIAL_STANDARDS':
            return `📋 **Tiêu chuẩn vật tư khuyến nghị:**

Để đảm bảo chất lượng công trình, Quý chủ nhà nên yêu cầu nhà thầu sử dụng:
1. **Xi măng**: PCB40 trở lên, có tem QC
2. **Thép**: Pomina hoặc Việt Nhật, đúng quy cách
3. **Gạch ốp lát**: Đạt chuẩn TCVN, độ cứng ≥6 Mohs

Tất cả đều có sẵn tại SmartBuild với giá minh bạch!`

        case 'PROJECT_DESCRIPTION':
            return `📝 **Mô tả dự án mẫu:**

**Quy mô:** Nhà ở 2 tầng, diện tích xây dựng 80m²

**Hạng mục chính:**
• Lát nền gạch men toàn bộ tầng 1 và tầng 2
• Ốp tường nhà vệ sinh (2 phòng)
• Sơn nước nội thất toàn bộ

**Yêu cầu vật tư:**
• Gạch men cao cấp 60x60cm
• Keo dán gạch chuyên dụng
• Sơn chống thấm + sơn phủ 2 lớp

**Tiến độ mong muốn:** 15-20 ngày làm việc`

        default:
            return `Xin chào! Tôi là trợ lý AI của SmartBuild. Tôi có thể giúp bạn soạn thảo:
• Thư ứng tuyển dự án
• Mô tả công trình chi tiết
• Phân tích báo giá cạnh tranh
• Gợi ý vật tư phù hợp

Hãy cho tôi biết bạn cần hỗ trợ gì!`
    }
}
