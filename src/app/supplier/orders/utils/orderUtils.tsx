import { FileText, CheckCircle, Truck, XCircle, Clock } from 'lucide-react'

export const getStatusText = (status: string) => {
    switch (status) {
        case 'RECEIVED': return 'Đang giao hàng'
        case 'CONFIRMED': return 'Đã xác nhận'
        case 'SENT': return 'Chờ xử lý'
        case 'CANCELLED': return 'Đã hủy'
        default: return status
    }
}

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'RECEIVED': return 'bg-emerald-100 text-emerald-800'
        case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
        case 'SENT': return 'bg-amber-100 text-amber-800'
        case 'CANCELLED': return 'bg-rose-100 text-rose-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

export const getStatusIcon = (status: string) => {
    switch (status) {
        case 'RECEIVED': return <Truck className="w-4 h-4" />
        case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />
        case 'SENT': return <Clock className="w-4 h-4" />
        case 'CANCELLED': return <XCircle className="w-4 h-4" />
        default: return <FileText className="w-4 h-4" />
    }
}

export const handlePrintOrder = (order: any) => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    const itemsHtml = order.purchaseItems.map((item: any, idx: number) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product?.name || 'Sản phẩm'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${new Intl.NumberFormat('vi-VN').format(item.unitPrice)} đ</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${new Intl.NumberFormat('vi-VN').format(item.totalPrice)} đ</td>
        </tr>
    `).join('')

    printWindow.document.write(`
        <html>
            <head>
                <title>Phiếu Giao Hàng - ${order.orderNumber}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; padding: 40px; }
                    .header { text-align: center; margin-bottom: 40px; }
                    .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
                    .meta { margin-bottom: 30px; display: flex; justify-content: space-between; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .table th { text-align: left; background: #f9f9f9; padding: 10px; border-bottom: 2px solid #000; font-size: 12px; text-transform: uppercase; }
                    .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
                    .sign-box { width: 200px; }
                    .sign-box p { font-weight: bold; margin-bottom: 60px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Phiếu Giao Hàng</h1>
                    <p>Mã đơn: <strong>#${order.orderNumber}</strong></p>
                </div>
                
                <div class="meta">
                    <div>
                        <strong>Người gửi:</strong><br>
                        SmartBuild Supplier System<br>
                        Hotline: 1900 1234
                    </div>
                    <div style="text-align: right;">
                        <strong>Ngày tạo:</strong> ${new Date().toLocaleDateString('vi-VN')}<br>
                        <strong>Trạng thái:</strong> ${order.status}
                    </div>
                </div>

                <table class="table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">STT</th>
                            <th>Tên sản phẩm</th>
                            <th style="width: 80px; text-align: center;">SL</th>
                            <th style="width: 120px; text-align: right;">Đơn giá</th>
                            <th style="width: 120px; text-align: right;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" style="text-align: right; padding: 20px; font-weight: bold;">Tổng cộng:</td>
                            <td style="text-align: right; padding: 20px; font-weight: bold; font-size: 18px;">
                                ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <div class="footer">
                    <div class="sign-box">
                        <p>Người giao hàng</p>
                        <span>(Ký, họ tên)</span>
                    </div>
                    <div class="sign-box">
                        <p>Người nhận hàng</p>
                        <span>(Ký, họ tên)</span>
                    </div>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
        </html>
    `)
    printWindow.document.close()
}
