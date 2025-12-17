import { prisma } from './prisma'


interface AnalyticalConcept {
    term: string
    definition: string
    formula?: string
    benchmark?: string
    insight?: string
    usage?: string
}

interface AnalyticalFramework {
    topic: string
    concepts: AnalyticalConcept[]
    guidance?: string
}

interface AdminPolicy {
    category: string
    content: string
}

// Advanced Business Analysis Frameworks
export const ADMIN_ANALYTICAL_FRAMEWORKS: AnalyticalFramework[] = [
    {
        topic: 'Phân Tích Doanh Thu (Revenue Analysis)',
        concepts: [
            {
                term: 'Biên Lợi Nhuận Gộp (Gross Margin)',
                definition: 'Doanh thu thuần trừ giá vốn hàng bán (COGS). Chỉ số này cho biết hiệu quả sản xuất/nhập hàng.',
                formula: 'Margin (%) = (Doanh thu - Giá vốn) / Doanh thu * 100',
                benchmark: 'Ngành vật liệu xây dựng thường dao động 15-25%.'
            },
            {
                term: 'Giá Trị Đơn Hàng Trung Bình (AOV)',
                definition: 'Trung bình mỗi đơn hàng trị giá bao nhiêu.',
                formula: 'AOV = Tổng doanh thu / Tổng số đơn hàng',
                insight: 'AOV giảm có thể do khuyến mãi quá nhiều hoặc khách chuyển sang mua sản phẩm rẻ.'
            }
        ],
        guidance: 'Khi admin hỏi về giảm doanh thu, hãy kiểm tra AOV và số lượng đơn hàng. Nếu AOV giảm, có thể do giá bán giảm. Nếu số đơn giảm, có thể do marketing kém.'
    },
    {
        topic: 'Quản Trị Tồn Kho (Inventory Management)',
        concepts: [
            {
                term: 'Vòng Quay Hàng Tồn Kho (Inventory Turnover)',
                definition: 'Số lần kho được bán hết và thay thế trong một kỳ.',
                formula: 'Turnover = Giá vốn hàng bán / Tồn kho bình quân',
                insight: 'Vòng quay thấp nghĩa là hàng ứ đọng, tốn chi phí lưu kho. Cao quá có thể gây đứt gãy nguồn cung.'
            },
            {
                term: 'Điểm Đặt Hàng Lại (Reorder Point)',
                definition: 'Mức tồn kho báo hiệu cần đặt hàng ngay.',
                formula: 'Reorder Point = (Bán bình quân ngày * Thời gian giao hàng) + Tồn kho an toàn',
                usage: 'Dùng để gợi ý admin khi nào cần nhập hàng cho dịp Tết hoặc cao điểm.'
            }
        ]
    },
    {
        topic: 'Hiệu Suất Nhân Sự (Staff Performance)',
        concepts: [
            {
                term: 'Tỷ Lệ Chốt Đơn (Conversion Rate)',
                definition: 'Số đơn hàng thành công / Tổng số khách tư vấn.',
                insight: 'Nhân viên có doanh số cao chưa chắc giỏi nếu họ tiếp quá nhiều khách nhưng chốt ít.'
            },
            {
                term: 'Thời Gian Xử Lý Đơn (Fulfillment Time)',
                definition: 'Thời gian từ lúc khách đặt đến lúc giao hàng.',
                benchmark: 'Tiêu chuẩn: < 4 giờ cho nội thành.'
            }
        ]
    }
]

// Specific Operational Policies
export const ADMIN_POLICIES: AdminPolicy[] = [
    {
        category: 'Quy Trình Đổi Trả (Return Policy)',
        content: `
    1. Điều kiện: Hàng nguyên seal, chưa sử dụng, trong 3 ngày.
    2. Phí: Miễn phí nếu lỗi NSX. Thu 10% nếu khách đổi ý.
    3. Quy trình nội bộ:
       - Bước 1: Nhân viên kho kiểm tra tình trạng.
       - Bước 2: Tạo phiếu 'GD_RETURN' trên hệ thống.
       - Bước 3: Manager duyệt (nếu giá trị > 2tr).
       - Bước 4: Hoàn tiền vào ví khách hàng (không hoàn tiền mặt trừ TH đặc biệt).
    `
    },
    {
        category: 'Quy Trình Xử Lý Đơn Giao Thất Bại (Failed Delivery)',
        content: `
    1. Tài xế báo cáo lý do (Khách không nghe máy / Từ chối nhận).
    2. Sale gọi lại xác nhận 3 lần trong 24h.
    3. Nếu vẫn thất bại:
       - Cập nhật trạng thái đơn sang 'CANCELLED_DELIVERY_FAILED'.
       - Trừ phí vận chuyển vào cọc (nếu có).
       - Nhập kho lại hàng hóa (Phiếu 'IN_RETURN').
    `
    },
    {
        category: 'Chính Sách Lương Thưởng (Payroll)',
        content: `
    1. Lương cơ bản: Theo hợp đồng.
    2. Hoa hồng (Commission):
       - 1% doanh số cho đơn gạch/cát/đá.
       - 0.5% cho xi măng/thép (biên lợi nhuận thấp).
    3. Thưởng phạt:
       - Đi muộn > 15p: Phạt 50k.
       - Đạt KPI tháng: Thưởng 10%.
    `
    }
]

// Helper to format knowledge base for RAG
export function getAdminKnowledgeBaseDocs() {
    const docs: string[] = []

    ADMIN_ANALYTICAL_FRAMEWORKS.forEach(section => {
        section.concepts.forEach(concept => {
            docs.push(`
      [ADMIN_KNOWLEDGE] Topic: ${section.topic}
      Term: ${concept.term}
      Definition: ${concept.definition}
      Formula: ${concept.formula || 'N/A'}
      Insight: ${concept.insight || 'N/A'}
      ${concept.benchmark ? `Benchmark: ${concept.benchmark}` : ''}
      `)
        })
        if (section.guidance) {
            docs.push(`[ADMIN_GUIDANCE] ${section.guidance}`)
        }
    })

    ADMIN_POLICIES.forEach(policy => {
        docs.push(`
    [ADMIN_POLICY] Category: ${policy.category}
    Content: ${policy.content}
    `)
    })

    return docs
}
