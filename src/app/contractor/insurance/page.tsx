'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import { Shield, AlertTriangle, FileText, CheckCircle, Clock, Download, X } from 'lucide-react'
import FormModal from '@/components/FormModal'
import { toast, Toaster } from 'react-hot-toast'

export default function ContractorInsurancePage() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [viewingPolicy, setViewingPolicy] = useState<any>(null)
    const [reportingClaim, setReportingClaim] = useState<any>(null)
    const [showBuyModal, setShowBuyModal] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [buyingType, setBuyingType] = useState<string | null>(null)

    // Form state for claim
    const [claimForm, setClaimForm] = useState({
        incidentDate: '',
        description: '',
        estimatedLoss: ''
    })

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            setSelectedFiles([...selectedFiles, ...newFiles])
            toast.success(`Đã chọn ${newFiles.length} file`)
        }
    }

    const handleBuyPolicy = (type: string) => {
        setBuyingType(type)
        // Mock buying process
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Đang khởi tạo hợp đồng...',
                success: 'Đăng ký thành công! Vui lòng thanh toán phí bảo hiểm.',
                error: 'Lỗi'
            }
        ).then(() => {
            setShowBuyModal(false)
            setBuyingType(null)
        })
    }

    const insuranceTypes = [
        {
            id: 'MATERIAL_TRANSIT',
            name: 'Bảo hiểm Vận chuyển (Material Transit)',
            desc: 'Bảo vệ hàng hóa vật liệu xây dựng trong quá trình vận chuyển.',
            price: 'Từ 0.1% giá trị hàng',
            icon: '🚛'
        },
        {
            id: 'CONSTRUCTION_ALL_RISK',
            name: 'Bảo hiểm Mọi rủi ro Xây dựng (CAR)',
            desc: 'Bảo vệ toàn diện cho công trình, vật tư và trách nhiệm bên thứ 3.',
            price: 'Từ 0.5% giá trị công trình',
            icon: '🏗️'
        },
        {
            id: 'WORKERS_COMPENSATION',
            name: 'Bảo hiểm Tai nạn Công nhân',
            desc: 'Bảo vệ tai nạn lao động cho công nhân trên công trường.',
            price: '200.000đ / người / năm',
            icon: '👷'
        }
    ]

    // Mock data for demo
    const policies = [
        {
            id: '1',
            policyNumber: 'BH-MAT-2024-00123',
            type: 'MATERIAL_TRANSIT',
            insurer: 'PVI Insurance',
            coverage: 500000000,
            expiryDate: '2024-05-30',
            status: 'ACTIVE',
            pdfUrl: '#'
        },
        {
            id: '2',
            policyNumber: 'BH-CAR-2024-00456',
            type: 'CONSTRUCTION_ALL_RISK',
            insurer: 'Bảo Việt',
            coverage: 2000000000,
            expiryDate: '2024-12-31',
            status: 'ACTIVE',
            pdfUrl: '#'
        }
    ]

    const handleViewContract = (policy: any) => {
        setViewingPolicy(policy)
    }

    const handleReportClaim = (policy: any) => {
        setReportingClaim(policy)
        setClaimForm({
            incidentDate: new Date().toISOString().split('T')[0],
            description: '',
            estimatedLoss: ''
        })
    }

    const submitClaim = () => {
        if (!claimForm.description || !claimForm.estimatedLoss) {
            toast.error('Vui lòng điền đầy đủ thông tin sự cố')
            return
        }

        // Mock submission
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Đang gửi yêu cầu bồi thường...',
                success: 'Đã gửi yêu cầu thành công! Mã hồ sơ: CLM-2024-8892',
                error: 'Có lỗi xảy ra'
            }
        ).then(() => {
            setReportingClaim(null)
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" />
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <Shield className="w-8 h-8 text-green-600" />
                                Bảo hiểm Công trình
                            </h1>
                            <p className="text-gray-500 mt-1">Quản lý các gói bảo hiểm và yêu cầu bồi thường (Claims)</p>
                        </div>
                        <button
                            onClick={() => setShowBuyModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                            + Mua gói bảo hiểm mới
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {policies.map(policy => (
                            <div key={policy.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-bl font-bold tracking-wide">ACTIVE</div>

                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                        <Shield className="w-7 h-7 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 text-lg">
                                            {policy.type === 'MATERIAL_TRANSIT' ? 'Bảo hiểm Vận chuyển' : 'Bảo hiểm Mọi rủi ro'}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-mono mt-1">{policy.policyNumber}</p>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-y-4 gap-x-8 text-sm border-t border-gray-100 pt-4">
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase font-medium">Nhà bảo hiểm</p>
                                        <p className="font-semibold text-gray-900 mt-0.5">{policy.insurer}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase font-medium">Bồi thường tối đa</p>
                                        <p className="font-bold text-gray-900 mt-0.5">{policy.coverage.toLocaleString('vi-VN')} đ</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase font-medium">Hiệu lực đến</p>
                                        <p className="font-medium text-gray-900 mt-0.5">{new Date(policy.expiryDate).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase font-medium">Trạng thái phí</p>
                                        <span className="inline-flex items-center gap-1 text-green-700 font-medium text-xs mt-0.5 bg-green-50 px-2 py-0.5 rounded">
                                            <CheckCircle className="w-3 h-3" /> Đã đóng
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => handleViewContract(policy)}
                                        className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Hợp đồng
                                    </button>
                                    <button
                                        onClick={() => handleReportClaim(policy)}
                                        className="flex-1 bg-red-50 text-red-700 py-2.5 rounded-lg hover:bg-red-100 font-medium text-sm border border-red-200 flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Yêu cầu bồi thường
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Claim History */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-500" />
                                Lịch sử Yêu cầu Bồi thường (Claims)
                            </h3>
                        </div>
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-1">Chưa có yêu cầu bồi thường nào</h3>
                            <p className="text-gray-500 text-sm">Nếu gặp sự cố, hãy gửi yêu cầu bồi thường ngay để được hỗ trợ.</p>
                        </div>
                    </div>

                    {/* Modals */}

                    {/* NEW: Buy Insurance Modal */}
                    <FormModal
                        isOpen={showBuyModal}
                        onClose={() => setShowBuyModal(false)}
                        title="Đăng ký Gói Bảo hiểm Mới"
                        size="lg"
                    >
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600 text-sm">Chọn gói bảo hiểm phù hợp với nhu cầu của bạn. Đối tác bảo hiểm uy tín: PVI, Bảo Việt, PTI.</p>
                            <div className="grid gap-4">
                                {insuranceTypes.map(type => (
                                    <div key={type.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                                            {type.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{type.name}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-blue-600">{type.price}</p>
                                            <button
                                                onClick={() => handleBuyPolicy(type.id)}
                                                disabled={buyingType === type.id}
                                                className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {buyingType === type.id ? 'Đang xử lý...' : 'Chọn mua'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FormModal>

                    {/* View Contract Modal */}
                    <FormModal
                        isOpen={!!viewingPolicy}
                        onClose={() => setViewingPolicy(null)}
                        title="Chi tiết Hợp đồng Bảo hiểm"
                        size="lg"
                    >
                        {viewingPolicy && (
                            <div className="p-6 space-y-6">
                                <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg">{viewingPolicy.type === 'MATERIAL_TRANSIT' ? 'Bảo hiểm Vận chuyển' : 'Bảo hiểm Mọi rủi ro'}</h3>
                                        <p className="text-sm text-gray-500">{viewingPolicy.policyNumber}</p>
                                    </div>
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">ACTIVE</span>
                                </div>

                                <div className="prose max-w-none text-sm text-gray-600">
                                    <h4 className="font-bold text-gray-900">Điều khoản chính</h4>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Bảo vệ toàn diện cho {viewingPolicy.type === 'MATERIAL_TRANSIT' ? 'hàng hóa trong quá trình vận chuyển từ kho đến công trình' : 'công trình xây dựng trước mọi rủi ro vật chất'}.</li>
                                        <li>Phạm vi bảo hiểm: {viewingPolicy.type === 'MATERIAL_TRANSIT' ? 'Hư hỏng, mất mát do tai nạn lật xe, cháy nổ, thiên tai' : 'Cháy nổ, sét đánh, lũ lụt, trộm cắp, sơ suất trong thi công'}.</li>
                                        <li>Mức khấu trừ: 5,000,000 VNĐ / vụ.</li>
                                        <li>Thời hạn thông báo sự cố: Trong vòng 24h kể từ khi xảy ra sự cố.</li>
                                    </ul>
                                </div>

                                <div className="flex gap-3 justify-end pt-4 border-t">
                                    <button onClick={() => setViewingPolicy(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Đóng</button>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
                                        <Download className="w-4 h-4" /> Tải Hợp đồng PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </FormModal>

                    {/* Report Claim Modal */}
                    <FormModal
                        isOpen={!!reportingClaim}
                        onClose={() => setReportingClaim(null)}
                        title="Gửi Yêu cầu Bồi thường (File a Claim)"
                        size="md"
                    >
                        {reportingClaim && (
                            <div className="p-6 space-y-4">
                                <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-red-800 font-medium">Lưu ý quan trọng</p>
                                        <p className="text-xs text-red-700 mt-1">Vui lòng giữ nguyên hiện trường và chụp ảnh chi tiết các thiệt hại. Nhân viên giám định sẽ liên hệ trong vòng 2h.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hợp đồng bảo hiểm</label>
                                        <input
                                            type="text"
                                            value={`${reportingClaim.policyNumber} - ${reportingClaim.insurer}`}
                                            disabled
                                            className="w-full px-3 py-2 bg-gray-100 border rounded-lg text-gray-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày xảy ra sự cố</label>
                                        <input
                                            type="date"
                                            value={claimForm.incidentDate}
                                            onChange={(e) => setClaimForm({ ...claimForm, incidentDate: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị thiệt hại ước tính (VNĐ)</label>
                                        <input
                                            type="number"
                                            placeholder="VD: 50,000,000"
                                            value={claimForm.estimatedLoss}
                                            onChange={(e) => setClaimForm({ ...claimForm, estimatedLoss: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sự cố & Thiệt hại</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Mô tả chi tiết nguyên nhân, diễn biến và mức độ thiệt hại..."
                                            value={claimForm.description}
                                            onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        ></textarea>
                                    </div>

                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors relative"
                                        onClick={() => document.getElementById('claim-file-upload')?.click()}
                                    >
                                        <input
                                            type="file"
                                            id="claim-file-upload"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        <p className="text-sm text-gray-500">Kéo thả hoặc click để tải lên ảnh hiện trường/biên bản</p>
                                        <button className="mt-2 text-blue-600 text-sm font-medium hover:underline">Chọn file</button>

                                        {selectedFiles.length > 0 && (
                                            <div className="mt-3 text-left bg-blue-50 p-2 rounded text-xs text-blue-700">
                                                <p className="font-bold mb-1">Đã chọn {selectedFiles.length} file:</p>
                                                <ul className="list-disc pl-4">
                                                    {selectedFiles.map((f, i) => (
                                                        <li key={i}>{f.name}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4 border-t">
                                    <button onClick={() => setReportingClaim(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy bỏ</button>
                                    <button onClick={submitClaim} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                                        Gửi Yêu cầu
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
