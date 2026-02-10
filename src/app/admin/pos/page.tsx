'use client'

import React, { useState, useEffect } from 'react'
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
    History
} from 'lucide-react'
import { fetchWithAuth } from '@/lib/api-client'
import { toast } from 'react-hot-toast'

interface Product {
    id: string
    name: string
    sku: string
    price: number
    unit: string
    category: { name: string } | null
    inventoryItem: { availableQuantity: number } | null
    images: string[]
}

interface CartItem {
    product: Product
    quantity: number
}

interface Customer {
    id: string
    name: string
    phone: string
    email?: string
    address?: string
}

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([])
    // const [filteredProducts, setFilteredProducts] = useState<Product[]>([]) // Removed, we use API filtering
    const [searchQuery, setSearchQuery] = useState('')
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [loading, setLoading] = useState(true)
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH')


    const [customers, setCustomers] = useState<Customer[]>([])
    const [showCustomerSearch, setShowCustomerSearch] = useState(false)
    const [customerSearchQuery, setCustomerSearchQuery] = useState('')

    // Categories
    const categories = ['Tất cả', 'Xi Măng', 'Sắt Thép', 'Gạch Xây', 'Cát Đá', 'Sơn', 'Điện Nước', 'Thiết Bị Vệ Sinh']
    const [activeCategory, setActiveCategory] = useState('Tất cả')

    // Fetch Products
    useEffect(() => {
        const timer = setTimeout(() => {
            loadProducts()
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery, activeCategory])

    const loadProducts = async () => {
        setLoading(true)
        try {
            let url = `/api/products?limit=50&isActive=true`
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`

            // Note: In a real app, mapping category name to ID is needed or API needs to support name filtering.
            // For now, we only use search text to filter.
            // If activeCategory is not 'All', we could try to pass it if API supported it by name,
            // but the current API expects ID or we need to implement name filtering on backend.
            // We'll skip strict category filtering for this demo step to ensure products load.

            const res = await fetchWithAuth(url)
            const data = await res.json()

            if (res.ok && data.success) {
                // Determine structure: data.data.data (paginated)
                setProducts(data.data?.data || [])
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

    // Search Customers
    useEffect(() => {
        if (showCustomerSearch && customerSearchQuery) {
            const timer = setTimeout(() => {
                searchCustomers()
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [customerSearchQuery, showCustomerSearch])

    const searchCustomers = async () => {
        try {
            const res = await fetchWithAuth(`/api/customers?search=${encodeURIComponent(customerSearchQuery)}&limit=5`)
            const data = await res.json()

            if (res.ok && data.success) {
                // Map API customer to local interface
                const mapped = (data.data?.data || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    phone: c.phone || 'N/A',
                    email: c.email,
                    address: c.address
                }))
                setCustomers(mapped)
            } else {
                toast.error(data.message || 'Lỗi tìm khách hàng')
            }
        } catch (err) {
            console.error(err)
            toast.error('Lỗi kết nối khi tìm khách hàng')
        }
    }

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

    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    const discount = 0
    const total = subtotal - discount

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Giỏ hàng trống!')
            return
        }

        setLoading(true)
        const toastId = toast.loading('Đang tạo đơn hàng...')

        try {
            const orderItems = cart.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                unitPrice: item.product.price,
                totalPrice: item.product.price * item.quantity
            }))

            const payload = {
                customerType: selectedCustomer ? 'REGISTERED' : 'GUEST',
                guestName: selectedCustomer ? undefined : 'Khách lẻ',
                items: orderItems,
                paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'BANK_TRANSFER',
                paymentType: 'FULL',
                totalAmount: total,
                shippingAmount: 0,
                netAmount: total,
                shippingAddress: {
                    address: 'Tại quầy',
                    city: 'Hồ Chí Minh'
                },
                notes: 'Đơn hàng POS'
            }

            // Using Guest logic for now to ensure it works for Admin if needed
            // If selectedCustomer implies a registered user, we might need to adjust logic if API doesn't support "on behalf of".
            // But usually for POS we can just use guest info if needed.
            const finalPayload = {
                ...payload,
                guestName: selectedCustomer ? selectedCustomer.name : 'Khách lẻ',
                guestPhone: selectedCustomer ? selectedCustomer.phone : undefined,
                guestEmail: selectedCustomer ? selectedCustomer.email : undefined
            }

            const res = await fetchWithAuth('/api/orders', {
                method: 'POST',
                body: JSON.stringify(finalPayload)
            })
            const data = await res.json()

            if (res.ok && data.success) {
                toast.success('Đơn hàng đã tạo thành công!', { id: toastId })
                setCart([])
                setSelectedCustomer(null)
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

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">

            {/* Left Column: Product Management */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">

                {/* Top Search & Filter */}
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
                                        {/* Show Image if available */}
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt="" className="w-6 h-6 object-cover rounded-md" />
                                        ) : (
                                            <Package className="w-6 h-6" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase text-white px-2 py-1 rounded-lg ${(product.inventoryItem?.availableQuantity || 0) > 0 ? 'bg-emerald-400' : 'bg-red-400'
                                        }`}>
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

            {/* Right Column: Cart & Checkout */}
            <div className="w-full lg:w-[450px] flex flex-col gap-6 bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">

                {/* Customer Selection */}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <ShoppingCart className="text-blue-600" /> Giỏ Hàng
                    </h2>
                    <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-colors" onClick={() => setCart([])}>
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-[24px] border border-dashed border-slate-200 relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            <User className="text-slate-400 w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            {selectedCustomer ? (
                                <div onClick={() => { setSelectedCustomer(null); setShowCustomerSearch(true); }}>
                                    <p className="text-sm font-black text-slate-900">{selectedCustomer.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{selectedCustomer.phone}</p>
                                </div>
                            ) : (
                                <div onClick={() => setShowCustomerSearch(!showCustomerSearch)} className="cursor-pointer">
                                    <p className="text-sm font-bold text-slate-400 italic">Chọn khách hàng...</p>
                                </div>
                            )}
                        </div>
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all" onClick={() => setShowCustomerSearch(!showCustomerSearch)}>
                            <UserPlus className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Customer Search Dropdown */}
                    {showCustomerSearch && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-3 animate-in zoom-in-95">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Tìm SĐT hoặc Tên..."
                                className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold mb-2 border-none focus:ring-2 focus:ring-blue-500"
                                value={customerSearchQuery}
                                onChange={e => setCustomerSearchQuery(e.target.value)}
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {customers.map(c => (
                                    <div
                                        key={c.id}
                                        className="p-2 hover:bg-blue-50 rounded-lg cursor-pointer flex justify-between items-center"
                                        onClick={() => {
                                            setSelectedCustomer(c)
                                            setShowCustomerSearch(false)
                                            setCustomerSearchQuery('')
                                        }}
                                    >
                                        <div>
                                            <p className="text-xs font-black text-slate-900">{c.name}</p>
                                            <p className="text-[10px] text-slate-500">{c.phone}</p>
                                        </div>
                                        <Plus size={14} className="text-blue-600" />
                                    </div>
                                ))}
                                {customers.length === 0 && customerSearchQuery && (
                                    <p className="text-xs text-center text-slate-400 py-2">Không tìm thấy</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {cart.map(item => (
                        <div key={item.product.id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-3xl transition-all">
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-sm">{item.product.name}</h4>
                                <p className="text-xs text-blue-600 font-black mt-1">
                                    {formatCurrency(item.product.price)} / {item.product.unit}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateQuantity(item.product.id, -1)}
                                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-red-500"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-black text-slate-900">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.product.id, 1)}
                                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-blue-500"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                            <Zap className="w-12 h-12 opacity-20 mb-2" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-300">Nhấp chọn SP để tính tiền</p>
                        </div>
                    )}
                </div>

                {/* Summary & Checkout */}
                <div className="mt-auto space-y-6 pt-6 border-t border-slate-100">
                    <div className="space-y-2">
                        <div className="flex justify-between text-slate-500 font-bold text-sm">
                            <span>Tạm tính</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-bold text-sm">
                            <span>Khuyến mãi</span>
                            <span className="text-emerald-500">-{formatCurrency(discount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 font-black text-xl pt-2 border-t border-dashed border-slate-100">
                            <span>Tổng Cộng</span>
                            <span className="text-blue-600">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setPaymentMethod('CASH')}
                            className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all ${paymentMethod === 'CASH' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'
                                }`}
                        >
                            <Banknote className="w-5 h-5" /> Tiền Mặt
                        </button>
                        <button
                            onClick={() => setPaymentMethod('TRANSFER')}
                            className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all ${paymentMethod === 'TRANSFER' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500'
                                }`}
                        >
                            <CreditCard className="w-5 h-5" /> Chuyển Khoản
                        </button>
                    </div>

                    <button
                        onClick={handleCheckout}
                        className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <Zap className="w-6 h-6 fill-white" /> XÁC NHẬN THANH TOÁN
                    </button>

                    <div className="flex justify-center gap-6">
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600">
                            <Printer className="w-4 h-4" /> In Tạm Tính
                        </button>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600">
                            <History className="w-4 h-4" /> Lịch Sử
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
