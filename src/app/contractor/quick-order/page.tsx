'use client'

/**
 * Contractor Quick Order Page - Redesigned
 * 2-section layout: Left = checkbox product grid, Right = selected items with quantities
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    Building2,
    Search,
    ShoppingCart,
    Package,
    Check,
    X,
    Plus,
    Minus,
    Trash2,
    Filter,
    ArrowRight,
    Loader2
} from 'lucide-react'
import { useContractorCartStore } from '@/stores/contractorCartStore'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import toast, { Toaster } from 'react-hot-toast'

interface Product {
    id: string
    name: string
    sku: string
    price: number
    unit: string
    stock: number
    image?: string
    images?: string[]
    category?: { id: string; name: string }
}

interface SelectedProduct extends Product {
    quantity: number
}

const SELECTION_STORAGE_KEY = 'contractor-quick-order-selection'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function QuickOrderPage() {
    const router = useRouter()
    const { addItem, getTotalItems } = useContractorCartStore()

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

    // Selected products for right panel
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
    const [submitting, setSubmitting] = useState(false)

    // Load products and user
    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }

        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products?limit=100')
                const json = await res.json()
                const data = json.data?.data || json.data || []
                setProducts(data)

                // Extract unique categories
                const uniqueCategories = new Map<string, { id: string; name: string }>()
                data.forEach((p: Product) => {
                    if (p.category) {
                        uniqueCategories.set(p.category.id, p.category)
                    }
                })
                setCategories(Array.from(uniqueCategories.values()))
            } catch (error) {
                console.error('Failed to fetch products:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [])

    // Load saved selection from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(SELECTION_STORAGE_KEY)
        if (saved) {
            try {
                setSelectedProducts(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse saved selection')
            }
        }
    }, [])

    // Save selection to localStorage
    useEffect(() => {
        localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(selectedProducts))
    }, [selectedProducts])

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || p.category?.id === selectedCategory
        return matchesSearch && matchesCategory
    })

    // Check if product is selected
    const isSelected = (productId: string) => {
        return selectedProducts.some(p => p.id === productId)
    }

    // Toggle product selection
    const toggleProduct = (product: Product) => {
        if (isSelected(product.id)) {
            setSelectedProducts(prev => prev.filter(p => p.id !== product.id))
        } else {
            setSelectedProducts(prev => [...prev, { ...product, quantity: 1 }])
        }
    }

    // Update quantity for selected product
    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            setSelectedProducts(prev => prev.filter(p => p.id !== productId))
            return
        }
        setSelectedProducts(prev => prev.map(p =>
            p.id === productId ? { ...p, quantity } : p
        ))
    }

    // Remove from selection
    const removeProduct = (productId: string) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== productId))
    }

    // Select all visible products
    const selectAll = () => {
        const newSelections = filteredProducts.filter(p => !isSelected(p.id))
            .map(p => ({ ...p, quantity: 1 }))
        setSelectedProducts(prev => [...prev, ...newSelections])
    }

    // Clear selection
    const clearSelection = () => {
        setSelectedProducts([])
    }

    // Calculate totals
    const totalItems = selectedProducts.reduce((sum, p) => sum + p.quantity, 0)
    const totalPrice = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0)

    // Add to cart
    const handleAddToCart = async () => {
        if (selectedProducts.length === 0) {
            toast.error('Chưa chọn sản phẩm nào!')
            return
        }

        setSubmitting(true)
        try {
            for (const product of selectedProducts) {
                addItem({
                    id: product.id,
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    sku: product.sku,
                    unit: product.unit,
                    quantity: product.quantity,
                    image: product.images?.[0] || product.image
                })
            }

            toast.success(`Đã thêm ${selectedProducts.length} sản phẩm vào giỏ!`)
            clearSelection()

            setTimeout(() => {
                router.push('/contractor/cart')
            }, 1000)
        } catch (error) {
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" />

            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content - 2 Sections */}
            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="flex h-[calc(100vh-73px)]">
                    {/* LEFT SECTION: Product Selection */}
                    <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
                        {/* Search & Filters */}
                        <div className="p-4 border-b border-gray-100 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm sản phẩm theo tên hoặc SKU..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <button
                                    onClick={selectAll}
                                    className="px-4 py-2.5 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium whitespace-nowrap"
                                >
                                    Chọn tất cả
                                </button>
                            </div>

                            {/* Category Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Tất cả ({products.length})
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {filteredProducts.map((product) => {
                                        const selected = isSelected(product.id)
                                        const imgSrc = product.images?.[0] || product.image
                                        return (
                                            <button
                                                key={product.id}
                                                onClick={() => toggleProduct(product)}
                                                className={`relative p-3 rounded-xl border-2 text-left transition-all hover:shadow-md ${selected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                                    }`}
                                            >
                                                {/* Checkbox */}
                                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : 'border-gray-300 bg-white'
                                                    }`}>
                                                    {selected && <Check className="w-4 h-4 text-white" />}
                                                </div>

                                                {/* Image */}
                                                <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                                                    {imgSrc ? (
                                                        <Image
                                                            src={imgSrc}
                                                            alt={product.name}
                                                            width={120}
                                                            height={120}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-10 h-10 text-gray-300" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                                                    {product.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mb-1">{product.sku}</p>
                                                <p className="text-blue-600 font-semibold text-sm">
                                                    {formatCurrency(product.price)}/{product.unit}
                                                </p>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {!loading && filteredProducts.length === 0 && (
                                <div className="text-center text-gray-500 py-12">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>Không tìm thấy sản phẩm</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SECTION: Selected Products */}
                    <div className="w-96 flex flex-col bg-gray-50">
                        {/* Header */}
                        <div className="p-4 bg-white border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                                    Đã chọn ({selectedProducts.length})
                                </h2>
                                {selectedProducts.length > 0 && (
                                    <button
                                        onClick={clearSelection}
                                        className="text-red-500 text-sm hover:underline"
                                    >
                                        Xóa tất cả
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Selected Items List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {selectedProducts.length === 0 ? (
                                <div className="text-center text-gray-400 py-12">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm">Chọn sản phẩm từ danh sách bên trái</p>
                                </div>
                            ) : (
                                selectedProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm"
                                    >
                                        <div className="flex gap-3">
                                            {/* Image */}
                                            <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                {product.images?.[0] || product.image ? (
                                                    <Image
                                                        src={product.images?.[0] || product.image!}
                                                        alt={product.name}
                                                        width={56}
                                                        height={56}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                                    {product.name}
                                                </h4>
                                                <p className="text-xs text-gray-500">{product.sku}</p>
                                                <p className="text-blue-600 font-medium text-sm">
                                                    {formatCurrency(product.price)}/{product.unit}
                                                </p>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => removeProduct(product.id)}
                                                className="text-gray-400 hover:text-red-500 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Quantity & Subtotal */}
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(product.id, product.quantity - 1)}
                                                    className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={product.quantity}
                                                    onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                                                    className="w-14 text-center border border-gray-200 rounded py-1 text-sm"
                                                    min="1"
                                                />
                                                <button
                                                    onClick={() => updateQuantity(product.id, product.quantity + 1)}
                                                    className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <span className="font-semibold text-gray-900">
                                                {formatCurrency(product.price * product.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer - Total & Add to Cart */}
                        {selectedProducts.length > 0 && (
                            <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Tổng ({totalItems} sản phẩm):</span>
                                    <span className="text-xl font-bold text-blue-600">
                                        {formatCurrency(totalPrice)}
                                    </span>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={submitting}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="w-5 h-5" />
                                            Thêm vào Giỏ Hàng
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
