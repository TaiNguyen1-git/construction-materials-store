import { 
    CreditCard, 
    Banknote, 
    Wallet 
} from 'lucide-react'
import { FAQCategory } from './types'

export const FAQ_DATA: FAQCategory[] = [
    {
        title: 'Hạn mức tín dụng',
        icon: CreditCard,
        color: 'from-blue-600 to-indigo-700',
        faqs: [
            {
                question: 'Làm thế nào để nâng hạn mức tín dụng doanh nghiệp?',
                answer: 'Duy trì lịch sử thanh toán đúng hạn 100% trong ít nhất 3 chu kỳ quyết toán với khối lượng thu mua ổn định. Gửi yêu cầu chính thức qua Trung tâm Tài chính → "Nâng hạn mức". Thời gian xem xét: 48-72 giờ làm việc.'
            },
            {
                question: 'Tại sao hạn mức tín dụng khả dụng của tôi bị giảm?',
                answer: 'Hạn mức bị giảm do: (1) Nhiều lần trễ hạn thanh toán, (2) Tỷ lệ hoàn trả hàng quá cao, (3) Tài khoản không hoạt động quá 60 ngày. Vui lòng liên hệ đội ngũ kiểm soát rủi ro để biết chi tiết.'
            }
        ]
    },
    {
        title: 'Giải ngân ký quỹ (Escrow)',
        icon: Banknote,
        color: 'from-emerald-600 to-green-700',
        faqs: [
            {
                question: 'Khi nào tiền ký quỹ (Escrow) được giải ngân?',
                answer: 'Giải ngân được kích hoạt khi: (1) CĐT xác nhận hoàn thành giai đoạn, (2) Không có khiếu nại trong 48h, (3) Hệ thống phê duyệt quyết toán. Thời gian chuyển tiền: 1-3 ngày làm việc.'
            },
            {
                question: 'Tại sao vốn ký quỹ của tôi bị phong tỏa?',
                answer: 'Vốn bị phong tỏa nếu: (1) Giai đoạn thiếu bằng chứng nghiệm thu, (2) Có khiếu nại đang xử lý, (3) Thiếu hồ sơ hoàn công, (4) CĐT chưa ủy quyền giải ngân. Kiểm tra trạng thái dự án để biết thêm.'
            }
        ]
    },
    {
        title: 'Hoa hồng & Thu nhập',
        icon: Wallet,
        color: 'from-purple-600 to-violet-700',
        faqs: [
            {
                question: 'Tỷ lệ chiết khấu/hoa hồng của tôi được tính thế nào?',
                answer: 'Tỷ lệ tăng dần theo hạng: Bạc (3-5%), Vàng (5-8%), Kim cương (8-12%). Tỷ lệ thực tế được tính toán linh hoạt dựa trên tổng khối lượng thu mua hàng tháng của bạn.'
            },
            {
                question: 'Cách tính thu nhập từ cộng tác viên (Affiliate)?',
                answer: 'Bạn nhận 2.0% hoa hồng trên tất cả các giai đoạn thu mua thành công từ các đơn vị được bạn giới thiệu. Thu nhập sẽ khả dụng trong Ví sau 30 ngày đối soát.'
            }
        ]
    }
]

export const AI_QUICK_REPLIES: Record<string, string> = {
    'hạn mức': 'Hạn mức tín dụng được xác định dựa trên lịch sử thanh toán và khối lượng giao dịch. Truy cập Trung tâm Tài chính → "Nâng hạn mức" để bắt đầu quy trình xét duyệt.',
    'ký quỹ': 'Giải ngân ký quỹ được kích hoạt sau khi nghiệm thu giai đoạn. Thời gian xử lý thông thường: 24-72 giờ sau khi đối soát thành công.',
    'hoa hồng': 'Tỷ lệ hoa hồng dựa trên phân hạng thành viên, từ 3% đến 12%. Kiểm tra phần "Cấp bậc đối tác" để xem chiến lược hoa hồng hiện tại của bạn.',
    'bảo hiểm': 'SmartBuild cung cấp các gói bảo hiểm rủi ro cho công trình, vận chuyển và nhân sự. Vui lòng tham khảo phần "Dịch vụ & Bảo hiểm" để biết chi tiết các gói đang hoạt động.',
    'khiếu nại': 'Bạn có thể tạo khiếu nại mới trong tab "Khiếu nại & Hòa giải". Đội ngũ hỗ trợ sẽ phản hồi trong vòng 24h.',
}
