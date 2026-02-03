'use client'

import { useState, useEffect, useRef } from 'react'
import {
    getReturns,
    getSuppliers,
    getEligiblePurchaseOrders,
    createReturn,
    updateReturnStatus
} from './actions'
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    ArrowLeft,
    ChevronDown,
    Package,
    AlertCircle,
    CheckCircle,
    XCircle,
    FileText,
    Truck,
    Camera,
    Upload,
    ShieldAlert,
    Phone,
    Calculator,
    CreditCard,
    Wallet,
    Info,
    Trash2,
    Users,
    Loader2,
    RefreshCw,
    Image as ImageIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function AdminReturnsPage() {
    const [returns, setReturns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)

    // Create Form States
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])

    const [selectedSupplier, setSelectedSupplier] = useState('')
    const [selectedPO, setSelectedPO] = useState('')
    const [poItems, setPoItems] = useState<any[]>([])
    const [returnReason, setReturnReason] = useState('')
    const [processingMethod, setProcessingMethod] = useState('REFUND')
    const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)

    // Items selected for return: { productId: { quantity, unitPrice, reason, condition } }
    const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number, unitPrice: number, maxQty: number, productName: string, condition: string }>>({})

    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        setLoading(true)
        const [returnsRes, suppliersRes] = await Promise.all([
            getReturns(),
            getSuppliers()
        ])

        if (returnsRes.success) setReturns(returnsRes.data || [])
        if (suppliersRes.success) setSuppliers(suppliersRes.data || [])
        setLoading(false)
    }

    const handleSupplierChange = async (supplierId: string) => {
        setSelectedSupplier(supplierId)
        setSelectedPO('')
        setPoItems([])
        setSelectedItems({})

        if (supplierId) {
            const res = await getEligiblePurchaseOrders(supplierId)
            if (res.success) setPurchaseOrders(res.data || [])
        } else {
            setPurchaseOrders([])
        }
    }

    const handlePOChange = (poId: string) => {
        setSelectedPO(poId)
        const po = purchaseOrders.find(p => p.id === poId)
        if (po) {
            setPoItems(po.purchaseItems)
        } else {
            setPoItems([])
        }
        setSelectedItems({})
    }

    const toggleItemSelection = (item: any) => {
        if (selectedItems[item.productId]) {
            const newItems = { ...selectedItems }
            delete newItems[item.productId]
            setSelectedItems(newItems)
        } else {
            setSelectedItems({
                ...selectedItems,
                [item.productId]: {
                    quantity: 1,
                    unitPrice: item.unitPrice,
                    maxQty: item.quantity,
                    productName: item.product.name,
                    condition: 'NEW'
                }
            })
        }
    }

    const updateItemQuantity = (productId: string, qty: number) => {
        if (selectedItems[productId]) {
            const max = selectedItems[productId].maxQty
            const validQty = Math.max(1, Math.min(qty, max))
            setSelectedItems({
                ...selectedItems,
                [productId]: { ...selectedItems[productId], quantity: validQty }
            })
        }
    }

    const handleSubmit = async () => {
        if (!selectedSupplier || !selectedPO || Object.keys(selectedItems).length === 0) return

        const itemsToReturn = Object.entries(selectedItems).map(([productId, data]) => ({
            productId,
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            reason: returnReason,
            condition: data.condition
        }))

        const res = await createReturn({
            supplierId: selectedSupplier,
            purchaseOrderId: selectedPO,
            reason: returnReason || 'Trả hàng theo yêu cầu admin',
            processingMethod,
            evidenceUrls,
            items: itemsToReturn
        })

        if (res.success) {
            setShowCreateModal(false)
            resetForm()
            loadInitialData()
            alert('Tạo yêu cầu hoàn trả thành công!')
        } else {
            alert('Có lỗi xảy ra: ' + res.error)
        }
    }

    const resetForm = () => {
        setSelectedSupplier('')
        setSelectedPO('')
        setPoItems([])
        setSelectedItems({})
        setReturnReason('')
        setEvidenceUrls([])
        setProcessingMethod('REFUND')
    }

    const currentSupplierInfo = suppliers.find(s => s.id === selectedSupplier)
    const totalRefundPreview = Object.values(selectedItems).reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

    const handleUploadButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()

            if (data.success) {
                setEvidenceUrls([...evidenceUrls, data.fileUrl])
                toast.success('Đã tải lên ảnh bằng chứng')
            } else {
                toast.error('Lỗi tải lên: ' + data.error)
            }
        } catch (error) {
            toast.error('Không thể kết nối máy chủ upload')
        } finally {
            setUploading(false)
            // Reset input so same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const updateItemCondition = (productId: string, condition: string) => {
        if (selectedItems[productId]) {
            setSelectedItems({
                ...selectedItems,
                [productId]: { ...selectedItems[productId], condition }
            })
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Chờ xử lý
                    </span>
                )
            case 'RECEIVED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        <Truck className="w-3 h-3" />
                        Đã nhận lại
                    </span>
                )
            case 'REFUNDED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        <CheckCircle className="w-3 h-3" />
                        Đã hoàn tiền
                    </span>
                )
            case 'CANCELLED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        <XCircle className="w-3 h-3" />
                        Đã hủy
                    </span>
                )
            default:
                return <span className="text-xs font-bold text-slate-400 uppercase">{status}</span>
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Hoàn trả (Purchase Returns)</h1>
                    <p className="text-gray-500">Tạo và theo dõi các yêu cầu trả hàng cho nhà cung cấp</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Tạo yêu cầu mới
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo mã đơn, NCC..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã yêu cầu</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhà cung cấp</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn nhập gốc</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Lý do</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá trị hoàn (VNĐ)</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                                </tr>
                            ) : returns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">Chưa có yêu cầu hoàn trả nào</td>
                                </tr>
                            ) : (
                                returns.map((r) => (
                                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group border-b border-slate-50 last:border-0">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs font-black text-blue-600 font-mono tracking-tighter bg-blue-50 px-2.5 py-1 rounded-lg">
                                                #{r.id.substring(r.id.length - 6).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                                {r.supplier?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                                {r.purchaseOrder?.orderNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-slate-500 line-clamp-1 italic max-w-xs" title={r.reason}>
                                                "{r.reason}"
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-black text-slate-900 tracking-tight">
                                                {new Intl.NumberFormat('vi-VN').format(r.totalRefundAmount)}<span className="text-[10px] ml-0.5 text-slate-400">₫</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getStatusBadge(r.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-xs font-bold text-slate-400">
                                                {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-white overflow-hidden animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">TẠO YÊU CẦU HOÀN TRẢ</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Xử lý hàng lỗi, hư hỏng hoặc sai quy cách</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 space-y-8 bg-white">
                            {/* Step 1: Info & Supplier */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhà cung cấp & Đối tác</label>
                                    </div>
                                    <select
                                        value={selectedSupplier}
                                        onChange={(e) => handleSupplierChange(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    >
                                        <option value="">-- Chọn Nhà cung cấp --</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>

                                    {currentSupplierInfo && (
                                        <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50 space-y-2">
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Phone className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{currentSupplierInfo.phone || 'Chưa cập nhật SĐT'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <Users className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{currentSupplierInfo.contactPerson || 'Chưa cập nhật người đại diện'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn nhập gốc (PO)</label>
                                    </div>
                                    <select
                                        value={selectedPO}
                                        onChange={(e) => handlePOChange(e.target.value)}
                                        disabled={!selectedSupplier}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                                    >
                                        <option value="">-- Chọn đơn nhập --</option>
                                        {purchaseOrders.map(p => (
                                            <option key={p.id} value={p.id}>{p.orderNumber} ({new Date(p.orderDate).toLocaleDateString('vi-VN')})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Step 2: Items Selection */}
                            {poItems.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                                                <Package className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách sản phẩm hoàn trả</label>
                                        </div>
                                        <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase">Đã chọn {Object.keys(selectedItems).length} SP</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {poItems.map((item) => {
                                            const isSelected = !!selectedItems[item.productId]
                                            return (
                                                <div key={item.id} className={`p-5 rounded-[32px] border transition-all duration-300 ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                                                    <div className="flex items-start gap-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleItemSelection(item)}
                                                            className="mt-1 w-6 h-6 text-blue-600 rounded-xl border-slate-200 focus:ring-blue-500 focus:ring-offset-0 transition-all"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-black text-slate-800">{item.product?.name}</p>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Đã nhập: {item.quantity} {item.product?.unit} • Đơn giá: {item.unitPrice.toLocaleString()}đ</p>
                                                                </div>
                                                                {isSelected && (
                                                                    <p className="text-sm font-black text-blue-600">
                                                                        + {(selectedItems[item.productId].quantity * item.unitPrice).toLocaleString()}đ
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {isSelected && (
                                                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Số lượng trả</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number"
                                                                                min={1}
                                                                                max={item.quantity}
                                                                                value={selectedItems[item.productId].quantity}
                                                                                onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value))}
                                                                                className="w-full px-4 py-3 bg-white border border-blue-100 rounded-2xl text-xs font-bold"
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">{item.product?.unit}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tình trạng hàng</label>
                                                                        <select
                                                                            value={selectedItems[item.productId].condition}
                                                                            onChange={(e) => updateItemCondition(item.productId, e.target.value)}
                                                                            className="w-full px-4 py-3 bg-white border border-blue-100 rounded-2xl text-xs font-bold"
                                                                        >
                                                                            <option value="NEW">Mới / Nguyên seal</option>
                                                                            <option value="OPENED">Đã khui / Mất hộp</option>
                                                                            <option value="DAMAGED">Hư hỏng vật lý</option>
                                                                            <option value="EXPIRED">Hết hạn sử dụng</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Evidence & Method */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                                            <Camera className="w-4 h-4 text-orange-500" />
                                        </div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bằng chứng hình ảnh</label>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        {evidenceUrls.map((url, i) => (
                                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group">
                                                <img src={url} className="w-full h-full object-cover" alt="Evidence" />
                                                <button
                                                    onClick={() => setEvidenceUrls(evidenceUrls.filter((_, idx) => idx !== i))}
                                                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {evidenceUrls.length < 4 && (
                                            <>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleUploadButtonClick}
                                                    disabled={uploading}
                                                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-blue-300 transition-all gap-1"
                                                >
                                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <Upload className="w-5 h-5 text-slate-400" />}
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">Tải ảnh</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                                            <CreditCard className="w-4 h-4 text-purple-500" />
                                        </div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phương thức hoàn trả</label>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'REFUND', icon: Wallet, label: 'Hoàn tiền về Ví' },
                                            { id: 'DEBT_DEDUCTION', icon: Calculator, label: 'Cấn trừ công nợ' },
                                            { id: 'REPLACEMENT', icon: RefreshCw, label: 'Đổi hàng mới' }
                                        ].map(method => (
                                            <button
                                                key={method.id}
                                                onClick={() => setProcessingMethod(method.id)}
                                                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${processingMethod === method.id ? 'bg-purple-50 border-purple-200' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'}`}
                                            >
                                                <method.icon className={`w-4 h-4 ${processingMethod === method.id ? 'text-purple-500' : 'text-slate-400'}`} />
                                                <span className={`text-[11px] font-black uppercase ${processingMethod === method.id ? 'text-purple-700' : 'text-slate-500'}`}>{method.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Step 4: Reason */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
                                        <Info className="w-4 h-4 text-pink-500" />
                                    </div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết lý do</label>
                                </div>
                                <textarea
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    placeholder="Ví dụ: 5 bao xi mãng bị ẩm vón cục do vận chuyển, xin đổi hàng..."
                                    className="w-full p-6 bg-slate-50 border-none rounded-[32px] text-sm font-bold focus:ring-4 focus:ring-blue-500/10 transition-all outline-none h-28"
                                />
                            </div>
                        </div>

                        {/* Summary Footer */}
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                    <Calculator className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TỔNG GIÁ TRỊ HOÀN TRẢ</p>
                                    <p className="text-xl font-black text-slate-800">{totalRefundPreview.toLocaleString()} VNĐ</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 sm:flex-none px-8 py-4 bg-white text-slate-400 font-bold rounded-[20px] hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!selectedPO || Object.keys(selectedItems).length === 0}
                                    className="flex-1 sm:flex-none px-10 py-4 bg-blue-600 text-white font-black rounded-[20px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10px] tracking-widest"
                                >
                                    Xác nhận hoàn trả
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
