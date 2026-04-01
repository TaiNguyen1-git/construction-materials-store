'use client'

import { useState, useEffect } from 'react'
import {
    Package,
    Search,
    Edit2,
    Save,
    X,
    ChevronRight,
    CheckCircle2,
    Upload,
    Loader2,
    AlertCircle,
    Trash2
} from 'lucide-react'
import Image from 'next/image'

interface Product {
    id: string
    name: string
    sku: string
    price: number
    isActive: boolean
    category: { name: string }
    images: string[]
    inventoryItem?: {
        availableQuantity: number
    }
}

export default function SupplierProducts() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({
        price: 0,
        availableQuantity: 0
    })

    // Create State
    const [isCreating, setIsCreating] = useState(false)
    const [createData, setCreateData] = useState({
        name: '',
        sku: '',
        price: 0,
        availableQuantity: 0,
        categoryId: '',
        description: '',
        imageUrl: '',
        suggestedCategory: ''
    })
    const [isUploading, setIsUploading] = useState(false)

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories')
            const data = await res.json()
            if (data.success) {
                // Flatten categories for simple dropdown
                const flats: { id: string, name: string }[] = []
                data.data.forEach((cat: any) => {
                    flats.push({ id: cat.id, name: cat.name })
                    if (cat.children) {
                        cat.children.forEach((child: any) => {
                            flats.push({ id: child.id, name: `${cat.name} > ${child.name}` })
                        })
                    }
                })
                setCategories(flats)
            }
        } catch (error) {
            console.error('Fetch categories failed')
        }
    }

    const fetchProducts = async () => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const token = localStorage.getItem('supplier_token')
            // ... (keep existing fetch logic)
            const res = await fetch(`/api/supplier/products?supplierId=${supplierId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success) setProducts(data.data)
            }
        } catch (error) {
            console.error('Fetch products error:', error)
        } finally {
            setLoading(false)
        }
    }

    // ... (keep handleEdit, handleSave, handleToggleActive, filteredProducts, formatCurrency)

    const handleEdit = (product: Product) => {
        setEditingId(product.id)
        setEditData({
            price: product.price,
            availableQuantity: product.inventoryItem?.availableQuantity || 0
        })
    }

    const handleSave = async (id: string) => {
        try {
            const token = localStorage.getItem('supplier_token')
            const res = await fetch('/api/supplier/products', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id, ...editData })
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setMessage({ type: 'success', text: 'Cập nhật sản phẩm thành công' })
                    setEditingId(null)
                    fetchProducts()
                    setTimeout(() => setMessage(null), 3000)
                }
            } else {
                setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' })
        }
    }

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('supplier_token')
            await fetch('/api/supplier/products', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id, isActive: !currentStatus })
            })
            fetchProducts()
        } catch (error) {
            console.error('Toggle status error:', error)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" vĩnh viễn không?`)) return;

        try {
            const token = localStorage.getItem('supplier_token')
            const res = await fetch(`/api/supplier/products?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setMessage({ type: 'success', text: 'Đã xóa sản phẩm thành công' })
                fetchProducts()
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: data.message || 'Không thể xóa sản phẩm. Có thể sản phẩm đã được liên kết với một đơn hàng.' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối khi xóa sản phẩm' })
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (data.success) {
                setCreateData(prev => ({ ...prev, imageUrl: data.fileUrl }))
                setMessage({ type: 'success', text: 'Tải ảnh lên thành công' })
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: 'Lỗi khi tải ảnh lên: ' + data.error })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi kết nối khi tải ảnh' })
        } finally {
            setIsUploading(false)
        }
    }

    const handleCreate = async () => {
        try {
            // Validation
            if (!createData.name || !createData.sku || !createData.categoryId || createData.price <= 0) {
                setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin bắt buộc' })
                return
            }

            const supplierId = localStorage.getItem('supplier_id')
            const token = localStorage.getItem('supplier_token')

            const payload = {
                ...createData,
                supplierId,
                images: createData.imageUrl ? [createData.imageUrl] : [],
                description: createData.categoryId === 'OTHER'
                    ? `[Đề xuất danh mục: ${createData.suggestedCategory}] ${createData.description}`
                    : createData.description
            }

            // If OTHER is selected, we need a valid categoryId to satisfy DB constraints
            // We'll search for an "Uncategorized" category or just the first one as fallback
            if (payload.categoryId === 'OTHER') {
                const uncategorized = categories.find(c =>
                    c.name.toLowerCase().includes('khác') ||
                    c.name.toLowerCase().includes('uncategorized') ||
                    c.name.toLowerCase().includes('chờ')
                )
                payload.categoryId = uncategorized ? uncategorized.id : (categories[0]?.id || '')
            }

            const res = await fetch('/api/supplier/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.success) {
                setMessage({ type: 'success', text: 'Tạo sản phẩm mới thành công' })
                setIsCreating(false)
                setCreateData({ name: '', sku: '', price: 0, availableQuantity: 0, categoryId: '', description: '', imageUrl: '', suggestedCategory: '' })
                fetchProducts()
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: data.message || 'Lỗi khi tạo sản phẩm' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Lỗi hệ thống' })
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Danh mục sản phẩm</h1>
                    <p className="text-slate-500 font-medium mt-1">Quản lý giá bán và tồn kho thời gian thực.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, SKU..."
                            className="pl-12 pr-6 py-3 w-72 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all shadow-sm font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Package className="w-5 h-5" />
                        <span>Thêm mới</span>
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 shadow-lg shadow-slate-100 ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
                    </div>
                    <p className="font-bold">{message.text}</p>
                </div>
            )}

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 py-32 flex flex-col items-center justify-center grayscale opacity-50">
                    <Package className="w-20 h-20 mb-6 text-slate-300" />
                    <p className="text-xl font-black uppercase tracking-[0.3em] text-slate-400">Không tìm thấy sản phẩm</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => {
                        const isEditing = editingId === product.id;
                        const stock = product.inventoryItem?.availableQuantity || 0;

                        return (
                            <div key={product.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative">
                                {/* Action Overlay (visible on hover) */}
                                {!isEditing && (
                                    <div className="absolute inset-x-0 top-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex justify-end gap-2 bg-gradient-to-b from-black/50 to-transparent">
                                        <button
                                            onClick={() => handleToggleActive(product.id, product.isActive)}
                                            className="w-10 h-10 bg-white/90 backdrop-blur text-slate-700 rounded-xl flex items-center justify-center hover:bg-white hover:text-blue-600 transition-all shadow-lg"
                                            title="Bật/Tắt"
                                        >
                                            {product.isActive ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="w-10 h-10 bg-white/90 backdrop-blur text-slate-700 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                                            title="Sửa nhanh"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id, product.name)}
                                            className="w-10 h-10 bg-white/90 backdrop-blur text-slate-700 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all shadow-lg"
                                            title="Xóa vĩnh viễn"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}

                                {/* Image Area */}
                                <div className="aspect-[4/3] w-full relative bg-slate-50 overflow-hidden">
                                    {product.images?.[0] ? (
                                        <Image
                                            src={product.images[0]}
                                            alt={product.name}
                                            fill
                                            className={`object-cover transition-transform duration-700 ${!isEditing ? 'group-hover:scale-105' : ''} ${!product.isActive ? 'grayscale opacity-70' : ''}`}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Package className="w-16 h-16" />
                                        </div>
                                    )}
                                    {/* Stock Badge Overlay */}
                                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-white/20">
                                        <div className={`w-2 h-2 rounded-full ${stock > 10 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${stock > 10 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    className="w-16 bg-transparent outline-none border-b border-slate-300 text-center text-slate-900"
                                                    value={editData.availableQuantity}
                                                    onChange={(e) => setEditData({ ...editData, availableQuantity: Number(e.target.value) })}
                                                />
                                            ) : (
                                                `${stock} có sẵn`
                                            )}
                                        </span>
                                    </div>
                                    {!product.isActive && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]">
                                            <span className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-xl rotate-12">Đã ngưng bán</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content Area */}
                                <div className="p-6 flex flex-col flex-1 bg-white relative z-10">
                                    <div className="flex items-center justify-between mb-3 gap-2">
                                        <span className="px-2.5 py-1 bg-slate-100/80 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-widest line-clamp-1 border border-slate-200/50">
                                            {product.category?.name || 'Khác'}
                                        </span>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[9px] font-black bg-slate-100/80 text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-slate-200/50">SKU</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-500">{product.sku}</span>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-4 flex-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {product.name}
                                    </h3>

                                    <div className="flex items-end justify-between mt-auto">
                                        <div className="w-full">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Giá Sỉ B2B</p>
                                            {isEditing ? (
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">đ</span>
                                                    <input
                                                        type="number"
                                                        className="w-full pl-8 pr-3 py-2.5 bg-white border-2 border-blue-600 rounded-xl outline-none shadow-lg shadow-blue-100 font-bold text-slate-900 text-lg"
                                                        value={editData.price}
                                                        onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-xl font-black text-slate-900">{formatCurrency(product.price)}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action row when strictly editing */}
                                    {isEditing && (
                                        <div className="mt-5 flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="flex-[1] py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                onClick={() => handleSave(product.id)}
                                                className="flex-[2] py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                                            >
                                                <Save className="w-4 h-4" /> Lưu Lại
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create Product Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCreating(false)} />
                    <div className="relative bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900">Thêm sản phẩm mới</h2>
                            <button onClick={() => setIsCreating(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tên sản phẩm *</label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                        placeholder="Nhập tên sản phẩm..."
                                        value={createData.name}
                                        onChange={e => setCreateData({ ...createData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Mã SKU *</label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium font-mono"
                                        placeholder="VD: GACH-001"
                                        value={createData.sku}
                                        onChange={e => setCreateData({ ...createData, sku: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Danh mục *</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none"
                                        value={createData.categoryId}
                                        onChange={e => setCreateData({ ...createData, categoryId: e.target.value })}
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                        <option value="OTHER">-- Khác (Tự đề xuất...) --</option>
                                    </select>
                                </div>
                                {createData.categoryId === 'OTHER' && (
                                    <div className="space-y-2 col-span-2 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-xs font-bold text-blue-600 uppercase">Tên danh mục đề xuất *</label>
                                        <input
                                            className="w-full px-4 py-3 bg-blue-50 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-blue-900 placeholder:text-blue-300"
                                            placeholder="Nhập tên ngành hàng bạn muốn bổ sung..."
                                            value={createData.suggestedCategory}
                                            onChange={e => setCreateData({ ...createData, suggestedCategory: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Giá bán (VNĐ) *</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                        value={createData.price}
                                        onChange={e => setCreateData({ ...createData, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Kho khả dụng</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                        value={createData.availableQuantity}
                                        onChange={e => setCreateData({ ...createData, availableQuantity: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">URL Hình ảnh</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                className="w-full pl-4 pr-12 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                                placeholder="Dán link ảnh hoặc tải lên..."
                                                value={createData.imageUrl}
                                                onChange={e => setCreateData({ ...createData, imageUrl: e.target.value })}
                                            />
                                            <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-2 hover:bg-slate-200 rounded-lg transition-colors">
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Upload className="w-5 h-5 text-slate-400" />}
                                            </label>
                                        </div>
                                        {createData.imageUrl && (
                                            <div className="w-12 h-12 rounded-lg relative overflow-hidden bg-slate-100 border border-slate-200">
                                                <Image src={createData.imageUrl} alt="Preview" fill className="object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Mô tả chi tiết</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium min-h-[100px]"
                                        placeholder="Nhập mô tả sản phẩm..."
                                        value={createData.description}
                                        onChange={e => setCreateData({ ...createData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                Tạo sản phẩm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
