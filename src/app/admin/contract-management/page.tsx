'use client'

/**
 * Contract Management Page - SME Feature 3
 * Trang quản lý hợp đồng và bảng giá B2B
 */

import { useState, useEffect } from 'react'
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    Users,
    Calendar,
    RefreshCw,
    Search,
    Eye
} from 'lucide-react'

interface Contract {
    id: string
    contractNumber: string
    name: string
    customerId: string
    customer: {
        user: { name: string }
    }
    contractType: string
    status: string
    validFrom: string
    validTo: string
    creditTermDays: number
    specialCreditLimit?: number
    _count: {
        contractPrices: number
    }
    createdAt: string
}

interface PriceList {
    id: string
    code: string
    name: string
    description?: string
    discountPercent: number
    customerTypes: string[]
    priority: number
    isActive: boolean
}

export default function ContractManagementPage() {
    const [activeTab, setActiveTab] = useState<'contracts' | 'price-lists'>('contracts')
    const [contracts, setContracts] = useState<Contract[]>([])
    const [priceLists, setPriceLists] = useState<PriceList[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'contracts') {
                const res = await fetch('/api/contracts')
                const data = await res.json()
                setContracts(data)
            } else {
                const res = await fetch('/api/price-lists')
                const data = await res.json()
                setPriceLists(data)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        }
        setLoading(false)
    }

    const handleActivateContract = async (contractId: string) => {
        try {
            await fetch('/api/contracts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'activate',
                    contractId,
                    approvedBy: 'admin'
                })
            })
            loadData()
        } catch (error) {
            console.error('Error activating contract:', error)
        }
    }

    const handleSeedPriceLists = async () => {
        try {
            const res = await fetch('/api/price-lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'seed-defaults' })
            })
            const data = await res.json()
            alert(data.message)
            loadData()
        } catch (error) {
            console.error('Error seeding price lists:', error)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700'
            case 'DRAFT': return 'bg-gray-100 text-gray-700'
            case 'PENDING': return 'bg-yellow-100 text-yellow-700'
            case 'EXPIRED': return 'bg-red-100 text-red-700'
            case 'CANCELLED': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Hiệu lực'
            case 'DRAFT': return 'Nháp'
            case 'PENDING': return 'Chờ duyệt'
            case 'EXPIRED': return 'Hết hạn'
            case 'CANCELLED': return 'Đã hủy'
            default: return status
        }
    }

    // Stats
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length
    const draftContracts = contracts.filter(c => c.status === 'DRAFT').length
    const expiringContracts = contracts.filter(c => {
        const validTo = new Date(c.validTo)
        const now = new Date()
        const diff = validTo.getTime() - now.getTime()
        return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000 && c.status === 'ACTIVE'
    }).length

    const filteredContracts = contracts.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.customer.user.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchStatus = !statusFilter || c.status === statusFilter
        return matchSearch && matchStatus
    })

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Hợp đồng & Giá B2B</h1>
                    <p className="text-gray-500">Thiết lập giá theo hợp đồng và bảng giá đa cấp</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo hợp đồng
                    </button>
                    <button
                        onClick={loadData}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Đang hiệu lực</p>
                            <p className="text-xl font-bold text-green-600">{activeContracts} hợp đồng</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Bản nháp</p>
                            <p className="text-xl font-bold">{draftContracts} hợp đồng</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Sắp hết hạn</p>
                            <p className="text-xl font-bold text-orange-600">{expiringContracts} hợp đồng</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Bảng giá</p>
                            <p className="text-xl font-bold">{priceLists.length} loại</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('contracts')}
                        className={`pb-3 px-1 border-b-2 font-medium ${activeTab === 'contracts'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Hợp đồng
                    </button>
                    <button
                        onClick={() => setActiveTab('price-lists')}
                        className={`pb-3 px-1 border-b-2 font-medium ${activeTab === 'price-lists'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Bảng giá
                    </button>
                </nav>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Contracts Tab */}
                    {activeTab === 'contracts' && (
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            {/* Filters */}
                            <div className="p-4 border-b flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm hợp đồng, khách hàng..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="ACTIVE">Hiệu lực</option>
                                    <option value="DRAFT">Nháp</option>
                                    <option value="PENDING">Chờ duyệt</option>
                                    <option value="EXPIRED">Hết hạn</option>
                                </select>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã HĐ</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên hợp đồng</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Loại</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hiệu lực</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SP</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredContracts.map((contract) => (
                                            <tr key={contract.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-mono text-sm">{contract.contractNumber}</td>
                                                <td className="px-4 py-3 font-medium">{contract.name}</td>
                                                <td className="px-4 py-3">{contract.customer.user.name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                        {contract.contractType}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm">
                                                    {formatDate(contract.validFrom)} - {formatDate(contract.validTo)}
                                                </td>
                                                <td className="px-4 py-3 text-center">{contract._count.contractPrices}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(contract.status)}`}>
                                                        {getStatusText(contract.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex gap-1 justify-center">
                                                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Xem">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="Sửa">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        {contract.status === 'DRAFT' && (
                                                            <button
                                                                onClick={() => handleActivateContract(contract.id)}
                                                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                                title="Kích hoạt"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredContracts.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    Chưa có hợp đồng nào
                                </div>
                            )}
                        </div>
                    )}

                    {/* Price Lists Tab */}
                    {activeTab === 'price-lists' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSeedPriceLists}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tạo bảng giá mặc định
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {priceLists.length === 0 ? (
                                    <div className="col-span-full bg-white rounded-xl p-12 text-center text-gray-500 border">
                                        <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>Chưa có bảng giá nào</p>
                                        <button
                                            onClick={handleSeedPriceLists}
                                            className="mt-4 text-blue-600 hover:underline"
                                        >
                                            Tạo bảng giá mặc định
                                        </button>
                                    </div>
                                ) : (
                                    priceLists.map((priceList) => (
                                        <div key={priceList.id} className="bg-white rounded-xl p-4 shadow-sm border">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${priceList.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {priceList.isActive ? 'Đang áp dụng' : 'Tạm dừng'}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-gray-500">#{priceList.priority}</span>
                                            </div>

                                            <h3 className="font-semibold text-lg mb-1">{priceList.name}</h3>
                                            <p className="text-sm text-gray-500 mb-3">Mã: {priceList.code}</p>

                                            {priceList.description && (
                                                <p className="text-sm text-gray-600 mb-3">{priceList.description}</p>
                                            )}

                                            <div className="border-t pt-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-gray-500">Chiết khấu:</span>
                                                    <span className="text-xl font-bold text-green-600">
                                                        {priceList.discountPercent}%
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {priceList.customerTypes.map((type, index) => (
                                                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                            {type}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
