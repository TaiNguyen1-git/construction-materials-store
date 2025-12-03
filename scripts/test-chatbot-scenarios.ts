import { POST } from '../src/app/api/chatbot/route'
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

// Mock NextRequest since we can't easily instantiate it with all Next.js context in a script
class MockRequest {
    private body: any
    public headers: Map<string, string>
    public url: string

    constructor(body: any, headers: any = {}) {
        this.body = body
        this.headers = new Map(Object.entries(headers))
        this.url = 'http://localhost:3000/api/chatbot'
    }

    async json() {
        return this.body
    }
}

// Generate 100 prompts
const prompts = [
    // --- GREETINGS (5) ---
    { role: 'user', msg: 'Xin chào', isAdmin: false },
    { role: 'user', msg: 'Hello shop', isAdmin: false },
    { role: 'user', msg: 'Có ai ở đó không?', isAdmin: false },
    { role: 'user', msg: 'Chào bạn, mình cần tư vấn', isAdmin: false },
    { role: 'user', msg: 'Hi', isAdmin: false },

    // --- PRODUCT SEARCH (20) ---
    { role: 'user', msg: 'Tìm cho mình xi măng Hà Tiên', isAdmin: false },
    { role: 'user', msg: 'Có bán gạch ống không?', isAdmin: false },
    { role: 'user', msg: 'Giá thép Hòa Phát hôm nay', isAdmin: false },
    { role: 'user', msg: 'Tôi muốn mua cát xây dựng', isAdmin: false },
    { role: 'user', msg: 'Shop có sơn Dulux không?', isAdmin: false },
    { role: 'user', msg: 'Tìm đá 1x2', isAdmin: false },
    { role: 'user', msg: 'Báo giá tôn Hoa Sen', isAdmin: false },
    { role: 'user', msg: 'Có máy khoan cầm tay không?', isAdmin: false },
    { role: 'user', msg: 'Tìm gạch lát nền 60x60', isAdmin: false },
    { role: 'user', msg: 'Xi măng trắng giá bao nhiêu?', isAdmin: false },
    { role: 'user', msg: 'Cát san lấp bao nhiêu 1 khối?', isAdmin: false },
    { role: 'user', msg: 'Thép cuộn phi 6', isAdmin: false },
    { role: 'user', msg: 'Đá mi bụi', isAdmin: false },
    { role: 'user', msg: 'Gạch thẻ ốp tường', isAdmin: false },
    { role: 'user', msg: 'Sơn chống thấm Kova', isAdmin: false },
    { role: 'user', msg: 'Ống nước Bình Minh', isAdmin: false },
    { role: 'user', msg: 'Dây điện Cadivi', isAdmin: false },
    { role: 'user', msg: 'Bóng đèn Rạng Đông', isAdmin: false },
    { role: 'user', msg: 'Xi măng Insee đa dụng', isAdmin: false },
    { role: 'user', msg: 'Gạch không nung', isAdmin: false },

    // --- MATERIAL CALCULATION (30) ---
    // Basic
    { role: 'user', msg: 'Tính vật liệu xây nhà cấp 4 100m2', isAdmin: false },
    { role: 'user', msg: 'Tính gạch xây tường 50m2', isAdmin: false },
    { role: 'user', msg: 'Cần bao nhiêu xi măng cho sàn 100m2?', isAdmin: false },
    { role: 'user', msg: 'Tính vật liệu móng nhà 60m2', isAdmin: false },
    { role: 'user', msg: 'Xây phòng trọ 20m2 cần bao nhiêu tiền vật liệu?', isAdmin: false },

    // With Dimensions
    { role: 'user', msg: 'Tính vật liệu nhà 5x20m 2 tầng', isAdmin: false },
    { role: 'user', msg: 'Nhà 4x15m 3 tầng hết bao nhiêu xi măng?', isAdmin: false },
    { role: 'user', msg: 'Tính gạch xây tường dài 10m cao 3m', isAdmin: false },
    { role: 'user', msg: 'Sàn bê tông 80m2 dày 10cm cần bao nhiêu đá?', isAdmin: false },
    { role: 'user', msg: 'Móng băng nhà 5x15m', isAdmin: false },

    // With Soil Types (New Feature)
    { role: 'user', msg: 'Tính vật liệu nhà 2 tầng 80m2 đất yếu', isAdmin: false },
    { role: 'user', msg: 'Xây nhà trên đất ruộng 100m2 1 tầng', isAdmin: false },
    { role: 'user', msg: 'Nhà ở khu đất sình lầy 50m2', isAdmin: false },
    { role: 'user', msg: 'Tính móng nhà 3 tầng đất đồi cứng', isAdmin: false },
    { role: 'user', msg: 'Xây nhà vườn đất ao san lấp 120m2', isAdmin: false },
    { role: 'user', msg: 'Nhà 2 tầng 60m2 nền đất yếu cần bao nhiêu cọc?', isAdmin: false },
    { role: 'user', msg: 'Dự toán nhà 4x20m đất cứng', isAdmin: false },
    { role: 'user', msg: 'Xây trọ trên đất ruộng', isAdmin: false },
    { role: 'user', msg: 'Móng đơn cho đất tốt 40m2', isAdmin: false },
    { role: 'user', msg: 'Ép cọc cho nhà phố 3 tầng đất yếu', isAdmin: false },

    // With Construction Styles (New Feature)
    { role: 'user', msg: 'Tính gạch nhà 2 tầng phong cách mở', isAdmin: false },
    { role: 'user', msg: 'Nhà hiện đại 100m2 cần bao nhiêu vật liệu?', isAdmin: false },
    { role: 'user', msg: 'Xây biệt thự cổ điển 200m2', isAdmin: false },
    { role: 'user', msg: 'Nhà kính không gian mở 80m2', isAdmin: false },
    { role: 'user', msg: 'Nhà phố tân cổ điển 3 tầng 5x16m', isAdmin: false },
    { role: 'user', msg: 'Biệt thự vườn phong cách hiện đại', isAdmin: false },
    { role: 'user', msg: 'Nhà cấp 4 mái thái 100m2', isAdmin: false },
    { role: 'user', msg: 'Quán cafe khung thép tiền chế', isAdmin: false },
    { role: 'user', msg: 'Nhà xưởng công nghiệp 500m2', isAdmin: false },
    { role: 'user', msg: 'Showroom kính 2 mặt tiền', isAdmin: false },

    // --- PRICE INQUIRY (15) ---
    { role: 'user', msg: 'Giá cát hôm nay thế nào?', isAdmin: false },
    { role: 'user', msg: 'Xi măng nào rẻ nhất?', isAdmin: false },
    { role: 'user', msg: 'Bảng giá sắt thép mới nhất', isAdmin: false },
    { role: 'user', msg: 'Gạch ống bao nhiêu 1 thiên?', isAdmin: false },
    { role: 'user', msg: 'Đá 4x6 giá bao nhiêu 1 khối?', isAdmin: false },
    { role: 'user', msg: 'So sánh giá xi măng Hà Tiên và Insee', isAdmin: false },
    { role: 'user', msg: 'Tôn lạnh màu giá sao?', isAdmin: false },
    { role: 'user', msg: 'Sơn nước thùng 18L giá bao nhiêu?', isAdmin: false },
    { role: 'user', msg: 'Giá thép Pomina', isAdmin: false },
    { role: 'user', msg: 'Cát vàng bao nhiêu 1 xe?', isAdmin: false },
    { role: 'user', msg: 'Gạch men giá rẻ', isAdmin: false },
    { role: 'user', msg: 'Báo giá vật liệu phần thô', isAdmin: false },
    { role: 'user', msg: 'Giá nhân công xây dựng', isAdmin: false },
    { role: 'user', msg: 'Chi phí xây nhà trọn gói', isAdmin: false },
    { role: 'user', msg: 'Giá gạch lát sân vườn', isAdmin: false },

    // --- ADMIN: ANALYTICS (10) ---
    { role: 'admin', msg: 'Doanh thu hôm nay', isAdmin: true },
    { role: 'admin', msg: 'Báo cáo bán hàng tháng này', isAdmin: true },
    { role: 'admin', msg: 'Sản phẩm nào bán chạy nhất?', isAdmin: true },
    { role: 'admin', msg: 'Thống kê lợi nhuận quý 1', isAdmin: true },
    { role: 'admin', msg: 'Khách hàng nào mua nhiều nhất?', isAdmin: true },
    { role: 'admin', msg: 'So sánh doanh thu với tháng trước', isAdmin: true },
    { role: 'admin', msg: 'Tổng đơn hàng tuần này', isAdmin: true },
    { role: 'admin', msg: 'Mặt hàng nào tồn kho lâu?', isAdmin: true },
    { role: 'admin', msg: 'Hiệu suất nhân viên kinh doanh', isAdmin: true },
    { role: 'admin', msg: 'Dự báo doanh thu tháng sau', isAdmin: true },

    // --- ADMIN: INVENTORY (10) ---
    { role: 'admin', msg: 'Kiểm tra tồn kho xi măng', isAdmin: true },
    { role: 'admin', msg: 'Sản phẩm nào sắp hết hàng?', isAdmin: true },
    { role: 'admin', msg: 'Cảnh báo tồn kho', isAdmin: true },
    { role: 'admin', msg: 'Tồn kho thép Hòa Phát còn bao nhiêu?', isAdmin: true },
    { role: 'admin', msg: 'Danh sách hàng cần nhập', isAdmin: true },
    { role: 'admin', msg: 'Kiểm kê kho gạch', isAdmin: true },
    { role: 'admin', msg: 'Giá trị tồn kho hiện tại', isAdmin: true },
    { role: 'admin', msg: 'Hàng hư hỏng, mất mát', isAdmin: true },
    { role: 'admin', msg: 'Lịch sử nhập hàng cát đá', isAdmin: true },
    { role: 'admin', msg: 'Nhà cung cấp nào giao hàng chậm?', isAdmin: true },

    // --- ADMIN: ORDERS (10) ---
    { role: 'admin', msg: 'Đơn hàng chờ xử lý', isAdmin: true },
    { role: 'admin', msg: 'Đơn hàng mới nhất', isAdmin: true },
    { role: 'admin', msg: 'Tìm đơn hàng của anh Nam', isAdmin: true },
    { role: 'admin', msg: 'Đơn hàng #12345 trạng thái thế nào?', isAdmin: true },
    { role: 'admin', msg: 'Duyệt tất cả đơn chờ', isAdmin: true },
    { role: 'admin', msg: 'Đơn hàng bị hủy tháng này', isAdmin: true },
    { role: 'admin', msg: 'Danh sách đơn chưa thanh toán', isAdmin: true },
    { role: 'admin', msg: 'Đơn hàng giao thất bại', isAdmin: true },
    { role: 'admin', msg: 'Khách hàng khiếu nại đơn hàng', isAdmin: true },
    { role: 'admin', msg: 'Xuất hóa đơn cho đơn #999', isAdmin: true },
]

interface TestResult {
    id: number
    role: string
    input: string
    output: string
    status: 'SUCCESS' | 'ERROR'
}

async function runStressTest() {
    console.log(`🚀 Starting Chatbot Stress Test with ${prompts.length} prompts...`)

    let successCount = 0
    let failCount = 0
    const results: TestResult[] = []

    // Process in batches to avoid overwhelming the system/logs
    const BATCH_SIZE = 5

    for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
        const batch = prompts.slice(i, i + BATCH_SIZE)
        console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(prompts.length / BATCH_SIZE)}...`)

        await Promise.all(batch.map(async (p, idx) => {
            const promptIndex = i + idx + 1
            try {
                const sessionId = `test-session-${Date.now()}-${promptIndex}`

                // Construct request body
                const body = {
                    message: p.msg,
                    sessionId: sessionId,
                    isAdmin: p.isAdmin,
                    userRole: p.isAdmin ? 'ADMIN' : 'CUSTOMER',
                    // Add dummy context
                    context: {
                        currentPage: '/home'
                    }
                }

                // Create mock request
                // We cast to any because we can't perfectly match NextRequest in script
                const req = new MockRequest(body, {
                    'x-forwarded-for': '127.0.0.1',
                    'user-agent': 'TestScript/1.0'
                }) as any

                // Call the API handler
                const response = await POST(req)
                const data = await response.json()

                if (response.status === 200) {
                    successCount++
                    console.log(`[${promptIndex}] ✅ ${p.isAdmin ? '[ADMIN]' : '[USER]'} "${p.msg}" -> ${data.data.message.substring(0, 50)}...`)
                    results.push({
                        id: promptIndex,
                        role: p.isAdmin ? 'ADMIN' : 'USER',
                        input: p.msg,
                        output: data.data.message,
                        status: 'SUCCESS'
                    })
                } else {
                    failCount++
                    console.error(`[${promptIndex}] ❌ ${p.isAdmin ? '[ADMIN]' : '[USER]'} "${p.msg}" -> Error: ${data.message}`)
                    results.push({
                        id: promptIndex,
                        role: p.isAdmin ? 'ADMIN' : 'USER',
                        input: p.msg,
                        output: `Error: ${data.message}`,
                        status: 'ERROR'
                    })
                }

            } catch (error: any) {
                failCount++
                console.error(`[${promptIndex}] 💥 Exception: ${error.message}`)
                results.push({
                    id: promptIndex,
                    role: p.isAdmin ? 'ADMIN' : 'USER',
                    input: p.msg,
                    output: `Exception: ${error.message}`,
                    status: 'ERROR'
                })
            }
        }))

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n==========================================')
    console.log(`🏁 Test Completed`)
    console.log(`✅ Success: ${successCount}`)
    console.log(`❌ Failed: ${failCount}`)
    console.log(`📊 Success Rate: ${((successCount / prompts.length) * 100).toFixed(1)}%`)
    console.log('==========================================')

    // Write results to file
    const outputFilePath = path.join(process.cwd(), 'chatbot_test_results.md')
    let markdownContent = '# Chatbot Stress Test Results\n\n'
    markdownContent += `**Date:** ${new Date().toLocaleString()}\n`
    markdownContent += `**Total Cases:** ${prompts.length}\n`
    markdownContent += `**Success Rate:** ${((successCount / prompts.length) * 100).toFixed(1)}%\n\n`
    markdownContent += '| ID | Role | Input | Output | Status |\n'
    markdownContent += '| :--- | :--- | :--- | :--- | :--- |\n'

    // Sort results by ID
    results.sort((a, b) => a.id - b.id)

    results.forEach(r => {
        // Escape pipe characters in output to avoid breaking markdown table
        const safeOutput = r.output.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
        markdownContent += `| ${r.id} | ${r.role} | ${r.input} | ${safeOutput} | ${r.status === 'SUCCESS' ? '✅' : '❌'} |\n`
    })

    fs.writeFileSync(outputFilePath, markdownContent)
    console.log(`\n📝 Detailed results saved to: ${outputFilePath}`)
}

runStressTest().catch(console.error)
