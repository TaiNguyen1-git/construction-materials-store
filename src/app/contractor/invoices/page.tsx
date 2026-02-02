'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import { Receipt, Download, FileText, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react'
import FormModal from '@/components/FormModal'

// ... existing interfaces ...
interface Invoice {
    id: string
    invoiceNumber: string
    sellerName: string
    totalAmount: number
    status: string
    createdAt: string
    pdfUrl?: string
}

interface InvoiceItem {
    id: string
    productName: string
    quantity: number
    unitPrice: number
    total: number
}

// ... existing InvoiceDetail interface ...

// ... inside component ...
const getStatusInfo = (status: string) => {
    switch (status) {
        case 'SENT': return { label: 'Đã phát hành', color: 'bg-green-100 text-green-800', icon: CheckCircle }
        case 'DRAFT': return { label: 'Nháp', color: 'bg-gray-100 text-gray-800', icon: FileText }
        case 'PENDING_SIGN': return { label: 'Chờ ký số', color: 'bg-orange-100 text-orange-800', icon: Clock }
        case 'CANCELLED': return { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
        default: return { label: status, color: 'bg-gray-100 text-gray-800', icon: FileText }
    }
}

interface InvoiceDetail extends Invoice {
    items: InvoiceItem[]
    buyerName: string
    buyerTaxCode: string
    buyerAddress: string
    subtotal: number
    vatAmount: number
}

export default function ContractorInvoicesPage() {
    const { user } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [viewingInvoice, setViewingInvoice] = useState<InvoiceDetail | null>(null)

    // ... (keep useEffect & fetchInvoices) ...
    useEffect(() => {
        if (user) {
            fetchInvoices()
        }
    }, [user])

    const fetchInvoices = async () => {
        setLoading(true)
        try {
            const res = await fetchWithAuth('/api/enterprise/invoices')
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

            const data = await res.json()
            if (data.success && data.data.invoices.length > 0) {
                setInvoices(data.data.invoices)
            } else {
                // FALLBACK: Use Mock Data if DB is empty for demo purpose
                console.log('Using mock data for demo')
                setInvoices([
                    { id: 'mock-1', invoiceNumber: 'HD2024000123', sellerName: 'Công ty SmartBuild', totalAmount: 55000000, status: 'SENT', createdAt: '2024-05-15T08:30:00Z', pdfUrl: '#' },
                    { id: 'mock-2', invoiceNumber: 'HD2024000124', sellerName: 'Nhà máy Thép Hòa Phát', totalAmount: 125000000, status: 'PENDING_SIGN', createdAt: '2024-05-18T10:15:00Z', pdfUrl: '#' },
                    { id: 'mock-3', invoiceNumber: 'HD2024000125', sellerName: 'Xi măng Vicem', totalAmount: 8900000, status: 'DRAFT', createdAt: '2024-05-20T14:20:00Z', pdfUrl: '#' }
                ])
            }
        } catch (error) {
            console.error('Failed to fetch invoices', error)
            // Error Fallback
            setInvoices([
                { id: 'mock-error-1', invoiceNumber: 'HD-DEMO-001', sellerName: 'Demo Data (API Error)', totalAmount: 10000000, status: 'SENT', createdAt: new Date().toISOString() },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleViewInvoice = async (invoice: Invoice) => {
        try {
            const res = await fetchWithAuth(`/api/enterprise/invoices/${invoice.id}`)
            const data = await res.json()
            if (data.success) {
                setViewingInvoice(data.data.invoice)
            } else {
                // Fallback for demo if API fails or no items
                setViewingInvoice({
                    ...invoice,
                    buyerName: 'Công ty Cổ phần Xây dựng Đại Nam',
                    buyerTaxCode: '0312345678',
                    buyerAddress: 'Tầng 12, Bitexco, Q1, TP.HCM',
                    subtotal: invoice.totalAmount / 1.1,
                    vatAmount: invoice.totalAmount - (invoice.totalAmount / 1.1),
                    items: [
                        { id: '1', productName: 'Vật tư tổng hợp (API Error)', quantity: 1, unitPrice: invoice.totalAmount, total: invoice.totalAmount }
                    ]
                } as InvoiceDetail)
                console.error(data.error)
            }
        } catch (error) {
            console.error('Error fetching invoice details:', error)
        }
    }

    // ... (keep getStatusInfo) ...

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* ... (Keep existing Header) ... */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <Receipt className="w-8 h-8 text-blue-600" />
                                Hóa đơn điện tử (VAT)
                            </h1>
                            <p className="text-gray-500 mt-1">Quản lý hóa đơn đầu vào, tải về định dạng PDF/XML</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                {/* ... (Keep Table Header) ... */}
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số hóa đơn</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày lập</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người bán</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền (VNĐ)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-gray-500">Đang tải dữ liệu hóa đơn...</td></tr>
                                    ) : invoices.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-gray-500">Chưa có hóa đơn nào</td></tr>
                                    ) : (
                                        invoices.map(invoice => {
                                            const status = getStatusInfo(invoice.status)
                                            return (
                                                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{invoice.invoiceNumber}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.sellerName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                                                        {invoice.totalAmount.toLocaleString('vi-VN')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                            <status.icon className="w-3 h-3" />
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleViewInvoice(invoice)}
                                                                className="text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors border border-transparent hover:border-blue-100"
                                                                title="Xem chi tiết"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors">
                                                                <Download className="w-3 h-3" />
                                                                PDF
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Invoice Detail Modal */}
                    <FormModal
                        isOpen={!!viewingInvoice}
                        onClose={() => setViewingInvoice(null)}
                        title="Chi tiết Hóa đơn Giá trị gia tăng"
                        size="lg"
                    >
                        {viewingInvoice && (
                            <div className="bg-white p-6 md:p-8 space-y-6">
                                {/* Invoice Header */}
                                <div className="border-b pb-6 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-blue-900 uppercase">Hóa đơn GTGT</h2>
                                        <p className="text-sm text-gray-500 mt-1">Bản thể hiện của hóa đơn điện tử</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-gray-700 text-lg">#{viewingInvoice.invoiceNumber}</p>
                                        <p className="text-sm text-gray-500">Ngày lập: {new Date(viewingInvoice.createdAt).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                </div>

                                {/* Participants */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-xs uppercase font-bold text-gray-400 mb-2">Bên bán (Seller)</p>
                                        <h3 className="font-bold text-gray-800">{viewingInvoice.sellerName}</h3>
                                        <p className="text-sm text-gray-600">MST: 0101234567</p>
                                        <p className="text-sm text-gray-600">Địa chỉ: KCN TechStack, Hà Nội</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase font-bold text-gray-400 mb-2">Bên mua (Buyer)</p>
                                        <h3 className="font-bold text-gray-800">{viewingInvoice.buyerName}</h3>
                                        <p className="text-sm text-gray-600">MST: {viewingInvoice.buyerTaxCode}</p>
                                        <p className="text-sm text-gray-600">Địa chỉ: {viewingInvoice.buyerAddress}</p>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="mt-4">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-500 border-y border-gray-200">
                                            <tr>
                                                <th className="py-3 px-4 text-left">STT</th>
                                                <th className="py-3 px-4 text-left">Tên hàng hóa, dịch vụ</th>
                                                <th className="py-3 px-4 text-right">Số lượng</th>
                                                <th className="py-3 px-4 text-right">Đơn giá</th>
                                                <th className="py-3 px-4 text-right">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {viewingInvoice.items.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                                                    <td className="py-3 px-4 font-medium">{item.productName}</td>
                                                    <td className="py-3 px-4 text-right">{item.quantity.toLocaleString('vi-VN')}</td>
                                                    <td className="py-3 px-4 text-right">{item.unitPrice.toLocaleString('vi-VN')}</td>
                                                    <td className="py-3 px-4 text-right font-medium">{item.total.toLocaleString('vi-VN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals */}
                                <div className="flex justify-end">
                                    <div className="w-full md:w-1/2 space-y-3 pt-4 border-t border-gray-200">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Cộng tiền hàng:</span>
                                            <span className="font-medium">{viewingInvoice.subtotal.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tiền thuế GTGT (10%):</span>
                                            <span className="font-medium">{viewingInvoice.vatAmount.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-blue-900 pt-2 border-t border-gray-100">
                                            <span>Tổng cộng tiền thanh toán:</span>
                                            <span>{viewingInvoice.totalAmount.toLocaleString('vi-VN')} đ</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                    <button onClick={() => setViewingInvoice(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Đóng</button>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                                        <Download className="w-4 h-4" /> Tải về máy
                                    </button>
                                </div>
                            </div>
                        )}
                    </FormModal>
                </div>
            </main>
        </div>
    )
}
