'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface KYCStatus {
    id?: string
    documentType?: string
    status: 'NONE' | 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED'
    rejectionReason?: string
    createdAt?: string
}

export default function ContractorKYCPage() {
    const [kycStatus, setKycStatus] = useState<KYCStatus>({ status: 'NONE' })
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        documentType: 'CCCD',
        documentNumber: '',
        frontImageUrl: '',
        backImageUrl: '',
        selfieUrl: '',
        businessLicenseUrl: '',
        taxCertificateUrl: ''
    })

    useEffect(() => {
        fetchKYCStatus()
    }, [])

    const fetchKYCStatus = async () => {
        try {
            const res = await fetch('/api/admin/integrity?view=kyc-queue&status=all')
            const data = await res.json()
            if (data.success && data.data.documents?.length > 0) {
                const doc = data.data.documents[0]
                setKycStatus({
                    id: doc.id,
                    documentType: doc.documentType,
                    status: doc.status,
                    rejectionReason: doc.rejectionReason,
                    createdAt: doc.createdAt
                })
            }
        } catch (error) {
            console.error('Failed to fetch KYC status:', error)
        }
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const res = await fetch('/api/admin/integrity/kyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (data.success) {
                setKycStatus({ status: 'PENDING' })
            } else {
                alert(data.error || 'Có lỗi xảy ra')
            }
        } catch (error) {
            console.error('Submit KYC failed:', error)
            alert('Có lỗi xảy ra khi gửi hồ sơ')
        }

        setSubmitting(false)
    }

    const documentTypeLabels: Record<string, string> = {
        CCCD: 'Căn cước công dân',
        CMND: 'Chứng minh nhân dân',
        PASSPORT: 'Hộ chiếu',
        BUSINESS_LICENSE: 'Giấy phép kinh doanh',
        TAX_CERTIFICATE: 'Đăng ký thuế',
        CONTRACTOR_LICENSE: 'Chứng chỉ hành nghề'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <Link href="/contractor" className="text-blue-600 hover:underline text-sm">
                        ← Quay lại Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 mt-2">🆔 Xác minh danh tính (KYC)</h1>
                    <p className="text-sm text-gray-500">
                        Xác minh danh tính để nhận tick xanh và tăng uy tín với khách hàng
                    </p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8">
                {/* Status Card */}
                {kycStatus.status !== 'NONE' && (
                    <div className={`rounded-xl p-6 mb-6 ${kycStatus.status === 'APPROVED' ? 'bg-green-50 border border-green-200' :
                            kycStatus.status === 'REJECTED' ? 'bg-red-50 border border-red-200' :
                                'bg-yellow-50 border border-yellow-200'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">
                                {kycStatus.status === 'APPROVED' ? '✅' :
                                    kycStatus.status === 'REJECTED' ? '❌' : '⏳'}
                            </div>
                            <div>
                                <div className="font-semibold text-lg">
                                    {kycStatus.status === 'APPROVED' ? 'Đã xác minh' :
                                        kycStatus.status === 'REJECTED' ? 'Bị từ chối' :
                                            kycStatus.status === 'REVIEWING' ? 'Đang xem xét' : 'Đang chờ xử lý'}
                                </div>
                                {kycStatus.status === 'REJECTED' && kycStatus.rejectionReason && (
                                    <p className="text-sm text-red-600 mt-1">
                                        Lý do: {kycStatus.rejectionReason}
                                    </p>
                                )}
                                {kycStatus.createdAt && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Gửi lúc: {new Date(kycStatus.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Benefits of Verification */}
                {kycStatus.status !== 'APPROVED' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-3">✨ Lợi ích khi xác minh</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                Nhận huy hiệu <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 rounded text-blue-700 font-medium">✓ Đã xác thực</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                Ưu tiên hiển thị trong kết quả tìm kiếm
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                Tăng niềm tin với khách hàng tiềm năng
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-blue-500">✓</span>
                                Giảm 5% phí nền tảng khi nhận dự án
                            </li>
                        </ul>
                    </div>
                )}

                {/* Submit Form */}
                {(kycStatus.status === 'NONE' || kycStatus.status === 'REJECTED') && (
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">📄 Gửi hồ sơ xác minh</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Loại giấy tờ *
                                </label>
                                <select
                                    value={formData.documentType}
                                    onChange={e => setFormData({ ...formData, documentType: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {Object.entries(documentTypeLabels).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số giấy tờ *
                                </label>
                                <input
                                    type="text"
                                    value={formData.documentNumber}
                                    onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                                    placeholder="VD: 001234567890"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ảnh mặt trước *
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.frontImageUrl}
                                        onChange={e => setFormData({ ...formData, frontImageUrl: e.target.value })}
                                        placeholder="URL ảnh mặt trước"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Upload ảnh và dán URL vào đây</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ảnh mặt sau
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.backImageUrl}
                                        onChange={e => setFormData({ ...formData, backImageUrl: e.target.value })}
                                        placeholder="URL ảnh mặt sau"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ảnh selfie cầm giấy tờ
                                </label>
                                <input
                                    type="url"
                                    value={formData.selfieUrl}
                                    onChange={e => setFormData({ ...formData, selfieUrl: e.target.value })}
                                    placeholder="URL ảnh selfie"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Chụp ảnh bạn đang cầm giấy tờ để xác minh</p>
                            </div>

                            <hr className="my-4" />

                            <p className="text-sm font-medium text-gray-700">Giấy tờ bổ sung (cho Nhà thầu/Doanh nghiệp)</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Giấy phép kinh doanh
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.businessLicenseUrl}
                                        onChange={e => setFormData({ ...formData, businessLicenseUrl: e.target.value })}
                                        placeholder="URL giấy phép"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Giấy đăng ký thuế
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.taxCertificateUrl}
                                        onChange={e => setFormData({ ...formData, taxCertificateUrl: e.target.value })}
                                        placeholder="URL giấy MST"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full mt-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? 'Đang gửi...' : '📤 Gửi hồ sơ xác minh'}
                        </button>
                    </form>
                )}

                {/* Already Approved */}
                {kycStatus.status === 'APPROVED' && (
                    <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h3 className="text-xl font-bold text-green-700">Tài khoản đã được xác minh!</h3>
                        <p className="text-gray-600 mt-2">
                            Hồ sơ của bạn đã được duyệt. Bạn đã có huy hiệu Đã xác thực và được hưởng các đặc quyền.
                        </p>
                        <Link
                            href="/contractor"
                            className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Quay lại Dashboard
                        </Link>
                    </div>
                )}

                {/* Pending/Reviewing */}
                {(kycStatus.status === 'PENDING' || kycStatus.status === 'REVIEWING') && (
                    <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                        <div className="text-6xl mb-4">⏳</div>
                        <h3 className="text-xl font-bold text-yellow-700">Đang chờ xử lý</h3>
                        <p className="text-gray-600 mt-2">
                            Hồ sơ của bạn đang được xem xét. Thời gian xử lý thường trong vòng 24-48 giờ làm việc.
                        </p>
                        <Link
                            href="/contractor"
                            className="inline-block mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                            Quay lại Dashboard
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}
