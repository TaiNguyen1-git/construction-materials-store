'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
    Search,
    ShoppingCart,
    User,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    Printer,
    Package,
    UserPlus,
    Zap,
    History,
    Tag,
    Percent,
    X,
    Edit2,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface Product {
    id: string
    name: string
    sku: string
    price: number
    unit: string
    category: { name: string } | null
    inventoryItem: { availableQuantity: number } | null
    images: string[]
    _id?: string
}

interface ItemDiscount {
    type: 'percent' | 'fixed'
    value: number
}

interface CartItem {
    product: Product
    quantity: number
    discount?: ItemDiscount
}

interface Customer {
    id: string
    name: string
    phone: string
    email?: string
    address?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [loading, setLoading] = useState(true)
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH')

    // Customer search
    const [customers, setCustomers] = useState<Customer[]>([])
    const [showCustomerSearch, setShowCustomerSearch] = useState(false)
    const [customerSearchQuery, setCustomerSearchQuery] = useState('')

    // Categories
    const categories = ['Tất cả', 'Xi Măng', 'Sắt Thép', 'Gạch Xây', 'Cát Đá', 'Sơn', 'Điện Nước', 'Thiết Bị Vệ Sinh']
    const [activeCategory, setActiveCategory] = useState('Tất cả')
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [recentOrders, setRecentOrders] = useState<any[]>([])

    // Per-item discount editing
    const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null)
    const [itemDiscountInput, setItemDiscountInput] = useState('')
    const [itemDiscountType, setItemDiscountType] = useState<'percent' | 'fixed'>('percent')
    const discountInputRef = useRef<HTMLInputElement>(null)

    // Order-level discount
    const [showOrderDiscount, setShowOrderDiscount] = useState(false)
    const [orderDiscountInput, setOrderDiscountInput] = useState('')
    const [orderDiscountType, setOrderDiscountType] = useState<'percent' | 'fixed'>('percent')
    const [orderDiscount, setOrderDiscount] = useState<ItemDiscount>({ type: 'percent', value: 0 })

    // ─── Fetch Products ──────────────────────────────────────────────────────

    useEffect(() => {
        const timer = setTimeout(() => { loadProducts() }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery, activeCategory])

    const loadProducts = async () => {
        setLoading(true)
        try {
            let url = `/api/products?limit=50&isActive=true`
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`
            const res = await fetchWithAuth(url)
            const data = await res.json()
            if (res.ok && data.success) {
                const rawProducts = data.data?.data || []
                setProducts(rawProducts.map((p: any) => ({ ...p, id: p.id || p._id })))
            } else {
                toast.error(data.message || 'Lỗi tải sản phẩm')
            }
        } catch (err) {
            console.error(err)
            toast.error('Lỗi kết nối')
        } finally {
            setLoading(false)
        }
    }

    // ─── Customer Search ─────────────────────────────────────────────────────

    useEffect(() => {
        if (showCustomerSearch && customerSearchQuery) {
            const timer = setTimeout(() => { searchCustomers() }, 300)
            return () => clearTimeout(timer)
        }
    }, [customerSearchQuery, showCustomerSearch])

    const searchCustomers = async () => {
        try {
            const res = await fetchWithAuth(`/api/customers?search=${encodeURIComponent(customerSearchQuery)}&limit=5`)
            const data = await res.json()
            if (res.ok && data.success) {
                setCustomers((data.data?.data || []).map((c: any) => ({
                    id: c.id, name: c.name, phone: c.phone || 'N/A', email: c.email, address: c.address
                })))
            } else {
                toast.error(data.message || 'Lỗi tìm khách hàng')
            }
        } catch {
            toast.error('Lỗi kết nối khi tìm khách hàng')
        }
    }

    // ─── Cart Actions ────────────────────────────────────────────────────────

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            }
            return [...prev, { product, quantity: 1 }]
        })
        toast.success(`Đã thêm: ${product.name}`, { duration: 1000 })
    }

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === id) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.product.id !== id))
    }

    // ─── Per-item Discount ───────────────────────────────────────────────────

    const openItemDiscount = (item: CartItem) => {
        setEditingDiscountId(item.product.id)
        setItemDiscountType(item.discount?.type ?? 'percent')
        setItemDiscountInput(item.discount?.value ? String(item.discount.value) : '')
        setTimeout(() => discountInputRef.current?.focus(), 50)
    }

    const applyItemDiscount = (productId: string) => {
        const value = parseFloat(itemDiscountInput) || 0
        setCart(prev => prev.map(item => {
            if (item.product.id !== productId) return item
            if (value === 0) return { ...item, discount: undefined }
            if (itemDiscountType === 'percent' && value > 100) {
                toast.error('Giảm giá % không được vượt quá 100%')
                return item
            }
            return { ...item, discount: { type: itemDiscountType, value } }
        }))
        setEditingDiscountId(null)
    }

    const clearItemDiscount = (productId: string) => {
        setCart(prev => prev.map(item =>
            item.product.id === productId ? { ...item, discount: undefined } : item
        ))
    }

    const getItemDiscountAmount = (item: CartItem) => {
        if (!item.discount || item.discount.value === 0) return 0
        const base = item.product.price * item.quantity
        return item.discount.type === 'percent'
            ? base * (item.discount.value / 100)
            : Math.min(item.discount.value, base)
    }

    const getItemTotal = (item: CartItem) =>
        item.product.price * item.quantity - getItemDiscountAmount(item)

    // ─── Order-level Discount ────────────────────────────────────────────────

    const applyOrderDiscount = () => {
        const value = parseFloat(orderDiscountInput) || 0
        if (orderDiscountType === 'percent' && value > 100) {
            toast.error('Giảm giá % không được vượt quá 100%')
            return
        }
        setOrderDiscount({ type: orderDiscountType, value })
        setShowOrderDiscount(false)
    }

    const clearOrderDiscount = () => {
        setOrderDiscount({ type: 'percent', value: 0 })
        setOrderDiscountInput('')
        setShowOrderDiscount(false)
    }

    // ─── Totals ──────────────────────────────────────────────────────────────

    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const itemDiscountTotal = cart.reduce((sum, item) => sum + getItemDiscountAmount(item), 0)
    const afterItemDiscount = subtotal - itemDiscountTotal
    const orderDiscountAmount = orderDiscount.value === 0 ? 0
        : orderDiscount.type === 'percent'
            ? afterItemDiscount * (orderDiscount.value / 100)
            : Math.min(orderDiscount.value, afterItemDiscount)
    const totalDiscount = itemDiscountTotal + orderDiscountAmount
    const total = Math.max(0, afterItemDiscount - orderDiscountAmount)

    // ─── Checkout ────────────────────────────────────────────────────────────

    const handleCheckout = async () => {
        if (cart.length === 0) { toast.error('Giỏ hàng trống!'); return }
        setLoading(true)
        const toastId = toast.loading('Đang tạo đơn hàng...')
        try {
            const orderItems = cart.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                unitPrice: item.product.price,
                totalPrice: getItemTotal(item)
            }))
            const finalPayload = {
                customerType: selectedCustomer ? 'REGISTERED' : 'GUEST',
                guestName: selectedCustomer ? selectedCustomer.name : 'Khách lẻ',
                guestPhone: selectedCustomer ? selectedCustomer.phone : undefined,
                guestEmail: selectedCustomer ? selectedCustomer.email : undefined,
                items: orderItems,
                paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'BANK_TRANSFER',
                paymentType: 'FULL',
                totalAmount: total,
                discountAmount: totalDiscount,
                shippingAmount: 0,
                netAmount: total,
                shippingAddress: { address: 'Tại quầy', city: 'Hồ Chí Minh' },
                notes: 'Đơn hàng POS'
            }
            const res = await fetchWithAuth('/api/orders', { method: 'POST', body: JSON.stringify(finalPayload) })
            const data = await res.json()
            if (res.ok && data.success) {
                toast.success('Đơn hàng đã tạo thành công!', { id: toastId })
                setCart([])
                setSelectedCustomer(null)
                setOrderDiscount({ type: 'percent', value: 0 })
                setOrderDiscountInput('')
            } else {
                toast.error(data.message || 'Lỗi tạo đơn hàng', { id: toastId })
            }
        } catch (error) {
            console.error('Checkout error:', error)
            toast.error('Lỗi tạo đơn hàng', { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    const handlePrintReceipt = () => {
        if (cart.length === 0) { toast.error('Giỏ hàng trống, không thể in!'); return }
        toast.success('Đang chuẩn bị bản in tạm tính...')
        window.print()
    }

    const fetchHistory = async () => {
        setIsHistoryOpen(true)
        setLoading(true)
        try {
            const res = await fetchWithAuth('/api/orders?limit=10')
            const data = await res.json()
            if (res.ok && data.success) { setRecentOrders(data.data?.data || []) }
            else { toast.error('Lỗi tải lịch sử đơn hàng') }
        } catch { toast.error('Lỗi kết nối khi tải lịch sử') }
        finally { setLoading(false) }
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">

            {/* ── Left Column: Product Grid ────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">

                {/* Search & Filter */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm tên sản phẩm hoặc mã SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${activeCategory === cat
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {loading && products.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-slate-400">Đang tải sản phẩm...</div>
                        ) : products.map(product => (
                            <div
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="group bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer active:scale-95"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt="" className="w-6 h-6 object-cover rounded-md" />
                                        ) : (
                                            <Package className="w-6 h-6" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase text-white px-2 py-1 rounded-lg ${(product.inventoryItem?.availableQuantity || 0) > 0 ? 'bg-emerald-400' : 'bg-red-400'}`}>
                                        Tồn: {product.inventoryItem?.availableQuantity || 0}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-900 leading-tight mb-1 line-clamp-2 min-h-[40px]">{product.name}</h3>
                                <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-3">{product.sku}</p>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold">Giá bán</p>
                                        <p className="text-lg font-black text-blue-600">{formatCurrency(product.price)}</p>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {products.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-40">
                            <Search className="w-16 h-16 text-slate-300 mb-4" />
                            <p className="font-black text-slate-400 uppercase tracking-widest">Không tìm thấy sản phẩm</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right Column: Cart & Checkout ────────────────────────────── */}
            <div className="w-full lg:w-[440px] h-full flex flex-col bg-white p-6 rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">

                {/* Header + Compact Customer */}
                <div className="shrink-0 mb-3">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <ShoppingCart className="text-blue-600" /> Giỏ Hàng
                        </h2>
                        <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-colors" onClick={() => setCart([])}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Customer Row */}
                    <div className="relative">
                        <div className="flex items-center gap-2">
                            {selectedCustomer ? (
                                <div className="flex-1 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-3 py-2">
                                    <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-blue-700 truncate">{selectedCustomer.name}</p>
                                        <p className="text-[10px] text-blue-400 font-medium">{selectedCustomer.phone}</p>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedCustomer(null); setShowCustomerSearch(false) }}
                                        className="p-0.5 hover:bg-blue-200 rounded-lg transition-colors shrink-0"
                                    >
                                        <X className="w-3 h-3 text-blue-400" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                                    className="flex-1 flex items-center gap-2 bg-slate-50 border border-dashed border-slate-200 rounded-2xl px-3 py-2 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-all group"
                                >
                                    <User className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                                    <p className="text-xs font-bold text-slate-400 group-hover:text-blue-500 italic transition-colors">Khách vãng lai</p>
                                </div>
                            )}
                            <button
                                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                                title="Chọn khách hàng"
                                className={`p-2 rounded-xl transition-all shrink-0 ${showCustomerSearch ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-blue-600 hover:bg-blue-100'}`}
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Customer Search Dropdown */}
                        {showCustomerSearch && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-3 animate-in fade-in zoom-in-95 duration-200">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Tìm SĐT hoặc Tên khách..."
                                    className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold mb-2 border-none focus:ring-2 focus:ring-blue-500"
                                    value={customerSearchQuery}
                                    onChange={e => setCustomerSearchQuery(e.target.value)}
                                />
                                <div className="max-h-44 overflow-y-auto space-y-1 scrollbar-thin">
                                    {customers.map(c => (
                                        <div
                                            key={c.id}
                                            className="p-2.5 hover:bg-blue-50 rounded-xl cursor-pointer flex justify-between items-center transition-colors"
                                            onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); setCustomerSearchQuery('') }}
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-slate-900 truncate">{c.name}</p>
                                                <p className="text-[10px] text-slate-500">{c.phone}</p>
                                            </div>
                                            <Plus size={14} className="text-blue-600 shrink-0" />
                                        </div>
                                    ))}
                                    {customers.length === 0 && customerSearchQuery && (
                                        <p className="text-xs text-center text-slate-400 py-4 font-medium italic">Không tìm thấy khách hàng</p>
                                    )}
                                    {customers.length === 0 && !customerSearchQuery && (
                                        <p className="text-xs text-center text-slate-300 py-4 font-medium italic">Nhập tên hoặc SĐT để tìm kiếm</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Cart Items ─────────────────────────────────────────────── */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200 mb-2">
                    {cart.map((item, idx) => {
                        const isEditing = editingDiscountId === item.product.id
                        const hasDiscount = !!item.discount && item.discount.value > 0
                        const discountAmt = getItemDiscountAmount(item)
                        const itemTotal = getItemTotal(item)

                        return (
                            <div
                                key={item.product.id || idx}
                                className="group bg-white rounded-[20px] border border-slate-100 hover:border-blue-200 transition-all overflow-hidden"
                            >
                                {/* Main Row */}
                                <div className="flex gap-3 p-3 items-center">
                                    {/* Image */}
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        {item.product.images?.[0] ? (
                                            <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-5 h-5 text-slate-300" />
                                        )}
                                    </div>

                                    {/* Info + Total */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-xs leading-tight line-clamp-1 mb-0.5">{item.product.name}</h4>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-[11px] text-slate-400 font-medium">
                                                {formatCurrency(item.product.price)} <span className="text-slate-300">/ {item.product.unit}</span>
                                            </p>
                                            {hasDiscount && (
                                                <span className="text-[9px] font-black bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded-md">
                                                    -{item.discount!.type === 'percent' ? `${item.discount!.value}%` : formatCurrency(item.discount!.value)}
                                                </span>
                                            )}
                                        </div>
                                        {/* Item total */}
                                        <p className="text-xs font-black text-blue-600 mt-0.5">{formatCurrency(itemTotal)}</p>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        {/* Qty */}
                                        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl">
                                            <button
                                                onClick={() => updateQuantity(item.product.id, -1)}
                                                className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-sm text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-6 text-center text-[11px] font-black text-slate-900">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, 1)}
                                                className="w-6 h-6 flex items-center justify-center rounded-lg bg-white shadow-sm text-slate-400 hover:text-blue-500 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        {/* Actions: discount + remove */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => hasDiscount ? clearItemDiscount(item.product.id) : openItemDiscount(item)}
                                                title={hasDiscount ? 'Xoá giảm giá' : 'Thêm giảm giá'}
                                                className={`flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-lg transition-all ${hasDiscount ? 'bg-orange-100 text-orange-500 hover:bg-orange-200' : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500'}`}
                                            >
                                                <Tag className="w-2.5 h-2.5" />
                                                {hasDiscount ? 'Bỏ KM' : 'KM'}
                                            </button>
                                            <button
                                                onClick={() => removeFromCart(item.product.id)}
                                                className="p-0.5 text-slate-300 hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Per-item Discount Inline Editor */}
                                {isEditing && (
                                    <div className="px-3 pb-3 animate-in slide-in-from-top-2 duration-150">
                                        <div className="bg-orange-50 border border-orange-100 rounded-[14px] p-2.5 flex items-center gap-2">
                                            <Tag className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                            <p className="text-[10px] font-black text-orange-500 shrink-0">Giảm giá sản phẩm:</p>
                                            {/* Type toggle */}
                                            <div className="flex bg-white rounded-lg overflow-hidden border border-orange-100 shrink-0">
                                                <button
                                                    onClick={() => setItemDiscountType('percent')}
                                                    className={`px-2 py-1 text-[10px] font-black transition-all ${itemDiscountType === 'percent' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}
                                                >%</button>
                                                <button
                                                    onClick={() => setItemDiscountType('fixed')}
                                                    className={`px-2 py-1 text-[10px] font-black transition-all ${itemDiscountType === 'fixed' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}
                                                >đ</button>
                                            </div>
                                            <input
                                                ref={discountInputRef}
                                                type="number"
                                                min="0"
                                                max={itemDiscountType === 'percent' ? 100 : undefined}
                                                value={itemDiscountInput}
                                                onChange={e => setItemDiscountInput(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') applyItemDiscount(item.product.id); if (e.key === 'Escape') setEditingDiscountId(null) }}
                                                placeholder={itemDiscountType === 'percent' ? '0 – 100' : 'Số tiền'}
                                                className="flex-1 min-w-0 bg-white border border-orange-100 rounded-lg px-2 py-1 text-xs font-black text-slate-700 focus:ring-1 focus:ring-orange-300 outline-none"
                                            />
                                            <button
                                                onClick={() => applyItemDiscount(item.product.id)}
                                                className="px-2 py-1 bg-orange-500 text-white text-[10px] font-black rounded-lg hover:bg-orange-600 transition-all shrink-0"
                                            >OK</button>
                                            <button onClick={() => setEditingDiscountId(null)} className="text-slate-300 hover:text-slate-500 shrink-0">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100 py-12">
                            <Zap className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giỏ hàng trống</p>
                        </div>
                    )}
                </div>

                {/* ── Summary & Checkout ─────────────────────────────────────── */}
                <div className="shrink-0 pt-3 border-t border-slate-100 bg-white space-y-3">

                    {/* Summary rows */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-slate-400 font-bold text-xs">
                            <span>Tạm tính</span>
                            <span className="text-slate-600">{formatCurrency(subtotal)}</span>
                        </div>

                        {/* Per-item discount summary (only shown if any) */}
                        {itemDiscountTotal > 0 && (
                            <div className="flex justify-between text-xs font-bold text-orange-500">
                                <span className="flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> KM sản phẩm
                                </span>
                                <span>-{formatCurrency(itemDiscountTotal)}</span>
                            </div>
                        )}

                        {/* Order-level discount — click to expand */}
                        <div>
                            <div
                                className="flex justify-between text-xs font-bold cursor-pointer group"
                                onClick={() => setShowOrderDiscount(!showOrderDiscount)}
                            >
                                <span className={`flex items-center gap-1 transition-colors ${orderDiscountAmount > 0 ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-500'}`}>
                                    <Tag className="w-3 h-3" />
                                    KM đơn hàng
                                    {showOrderDiscount ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                                <span className={orderDiscountAmount > 0 ? 'text-emerald-500' : 'text-slate-300'}>
                                    {orderDiscountAmount > 0 ? `-${formatCurrency(orderDiscountAmount)}` : '+ Thêm'}
                                </span>
                            </div>

                            {/* Order discount editor */}
                            {showOrderDiscount && (
                                <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-[14px] p-2.5 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
                                    <div className="flex bg-white rounded-lg overflow-hidden border border-emerald-100 shrink-0">
                                        <button
                                            onClick={() => setOrderDiscountType('percent')}
                                            className={`px-2 py-1 text-[10px] font-black transition-all ${orderDiscountType === 'percent' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}
                                        >%</button>
                                        <button
                                            onClick={() => setOrderDiscountType('fixed')}
                                            className={`px-2 py-1 text-[10px] font-black transition-all ${orderDiscountType === 'fixed' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}
                                        >đ</button>
                                    </div>
                                    <input
                                        autoFocus
                                        type="number"
                                        min="0"
                                        max={orderDiscountType === 'percent' ? 100 : undefined}
                                        value={orderDiscountInput}
                                        onChange={e => setOrderDiscountInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') applyOrderDiscount(); if (e.key === 'Escape') setShowOrderDiscount(false) }}
                                        placeholder={orderDiscountType === 'percent' ? '0 – 100' : 'Số tiền giảm'}
                                        className="flex-1 min-w-0 bg-white border border-emerald-100 rounded-lg px-2 py-1 text-xs font-black text-slate-700 focus:ring-1 focus:ring-emerald-300 outline-none"
                                    />
                                    <button onClick={applyOrderDiscount} className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg hover:bg-emerald-600 transition-all shrink-0">OK</button>
                                    {orderDiscount.value > 0 && (
                                        <button onClick={clearOrderDiscount} className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Total */}
                        <div className="flex justify-between text-slate-900 font-black text-lg pt-1.5 border-t border-dashed border-slate-100">
                            <span>Tổng Cộng</span>
                            <div className="text-right">
                                <span className="text-blue-600">{formatCurrency(total)}</span>
                                {totalDiscount > 0 && (
                                    <p className="text-[10px] text-emerald-500 font-bold text-right">Tiết kiệm {formatCurrency(totalDiscount)}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setPaymentMethod('CASH')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs transition-all ${paymentMethod === 'CASH' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Banknote className="w-4 h-4" /> Tiền Mặt
                        </button>
                        <button
                            onClick={() => setPaymentMethod('TRANSFER')}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs transition-all ${paymentMethod === 'TRANSFER' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            <CreditCard className="w-4 h-4" /> Chuyển Khoản
                        </button>
                    </div>

                    {/* Checkout Button */}
                    <button
                        onClick={handleCheckout}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <Zap className="w-5 h-5 fill-white" /> XÁC NHẬN THANH TOÁN
                    </button>

                    {/* Footer actions */}
                    <div className="flex justify-center gap-4 pb-1">
                        <button
                            onClick={handlePrintReceipt}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                        >
                            <Printer className="w-3.5 h-3.5" /> In Tạm Tính
                        </button>
                        <button
                            onClick={fetchHistory}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                        >
                            <History className="w-3.5 h-3.5" /> Lịch Sử
                        </button>
                    </div>
                </div>
            </div>

            {/* ── History Modal ─────────────────────────────────────────────── */}
            {isHistoryOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <History className="text-blue-600" /> Lịch sử đơn hàng POS
                            </h3>
                            <button onClick={() => setIsHistoryOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto scrollbar-thin">
                            {recentOrders.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 font-bold italic">Không có đơn hàng gần đây</div>
                            ) : (
                                <div className="space-y-4">
                                    {recentOrders.map((order: any) => (
                                        <div key={order.id} className="p-5 border border-slate-100 rounded-3xl hover:border-blue-200 transition-all flex flex-col md:flex-row justify-between gap-4 group">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg uppercase">#{order.orderNumber || order.id.slice(-6)}</span>
                                                    <span className="text-xs font-bold text-slate-900">{order.customer?.name || order.guestName || 'Khách lẻ'}</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-6">
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400 font-bold">Tổng tiền</p>
                                                    <p className="text-sm font-black text-blue-600">{formatCurrency(order.totalAmount)}</p>
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    {order.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setIsHistoryOpen(false)}
                                className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-sm text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                ĐÓNG
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
