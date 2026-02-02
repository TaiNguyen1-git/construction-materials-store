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
    Loader2
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

            {/* Product Grid/Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin sản phẩm</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá niêm yết</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Kho khả dụng</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => {
                                    const isEditing = editingId === product.id;
                                    const stock = product.inventoryItem?.availableQuantity || 0;

                                    return (
                                        <tr key={product.id} className={`group transition-all duration-300 ${isEditing ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 relative rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                        {product.images?.[0] ? (
                                                            <Image
                                                                src={product.images[0]}
                                                                alt={product.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                                                <Package className="w-8 h-8" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{product.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-tighter">SKU</span>
                                                            <span className="text-xs font-mono text-slate-400">{product.sku}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-wide">
                                                    {product.category?.name}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                {isEditing ? (
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">đ</span>
                                                        <input
                                                            type="number"
                                                            className="w-40 pl-8 pr-4 py-2 bg-white border-2 border-blue-600 rounded-xl outline-none shadow-lg shadow-blue-100 font-bold text-slate-900"
                                                            value={editData.price}
                                                            onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-lg font-black text-slate-900">{formatCurrency(product.price)}</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        className="w-24 px-4 py-2 bg-white border-2 border-blue-600 rounded-xl outline-none shadow-lg shadow-blue-100 font-bold text-slate-900"
                                                        value={editData.availableQuantity}
                                                        onChange={(e) => setEditData({ ...editData, availableQuantity: Number(e.target.value) })}
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${stock > 10 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                                            }`}>
                                                            {stock}
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${stock > 10 ? 'text-emerald-500' : 'text-rose-500'
                                                            }`}>
                                                            {stock > 10 ? 'Ổn định' : 'Gần hết'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <button
                                                    onClick={() => handleToggleActive(product.id, product.isActive)}
                                                    className={`group/btn relative px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${product.isActive
                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                                        : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                                                        }`}
                                                >
                                                    <span className="relative z-10">{product.isActive ? 'Đang kích hoạt' : 'Tạm ngưng'}</span>
                                                </button>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleSave(product.id)}
                                                                className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                                                                title="Lưu"
                                                            >
                                                                <Save className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all font-bold"
                                                                title="Hủy"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-blue-100"
                                                            title="Chỉnh sửa nhanh"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center grayscale opacity-10">
                                            <Package className="w-20 h-20 mb-6" />
                                            <p className="text-xl font-black uppercase tracking-[0.3em]">Không có dữ liệu</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
