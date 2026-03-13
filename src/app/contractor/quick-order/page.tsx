'use client'

/**
 * Contractor Quick Order Page — POS-Style Redesign
 * All-in-one: Product grid (left) + Cart & Checkout (right)
 * No need to navigate to /contractor/cart anymore
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'

import { Product, CartItem, EvaluatedCart, SuccessOrderData } from './types'
import ProductGrid from './components/ProductGrid'
import CartPanel from './components/CartPanel'
import SuccessModal from './components/SuccessModal'
import OrderHistoryModal from './components/OrderHistoryModal'

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

const CART_STORAGE_KEY = 'contractor-quick-order-cart'

export default function QuickOrderPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // ─── Products ────────────────────────────────────────────────────────────
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    // ─── Cart ────────────────────────────────────────────────────────────────
    const [cart, setCart] = useState<CartItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    // ─── B2B Pricing ─────────────────────────────────────────────────────────
    const [evaluatedCart, setEvaluatedCart] = useState<EvaluatedCart | null>(null)
    const [evaluating, setEvaluating] = useState(false)
    const evaluateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ─── Contractor Info ─────────────────────────────────────────────────────
    const [creditLimit, setCreditLimit] = useState(0)
    const [availableCredit, setAvailableCredit] = useState(0)

    // ─── Project Info ────────────────────────────────────────────────────────
    const [projectName, setProjectName] = useState('')
    const [poNumber, setPoNumber] = useState('')
    const [notes, setNotes] = useState('')

    // ─── Shipping ────────────────────────────────────────────────────────────
    const [shippingFee, setShippingFee] = useState(0)
    const [deliveryDate, setDeliveryDate] = useState('')

    // ─── Modals ──────────────────────────────────────────────────────────────
    const [successOrder, setSuccessOrder] = useState<SuccessOrderData | null>(null)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [recentOrders, setRecentOrders] = useState<any[]>([])

    // ═════════════════════════════════════════════════════════════════════════
    // Effects
    // ═════════════════════════════════════════════════════════════════════════

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(1)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Load categories once
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories')
                const json = await res.json()
                setCategories(json.data || [])
            } catch (error) {
                console.error('Failed to fetch categories:', error)
            }
        }
        fetchCategories()
    }, [])

    // Load products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                if (page === 1) setLoading(true)

                const queryParams = new URLSearchParams()
                queryParams.append('limit', '40')
                queryParams.append('page', page.toString())
                if (debouncedSearch) queryParams.append('q', debouncedSearch)
                if (selectedCategory !== 'all') queryParams.append('category', selectedCategory)

                const res = await fetch(`/api/products?${queryParams.toString()}`)
                const json = await res.json()
                const data = json.data?.data || json.data || []

                if (page === 1) {
                    setProducts(data)
                } else {
                    setProducts(prev => {
                        const existingIds = new Set(prev.map(p => p.id))
                        const newProducts = data.filter((p: Product) => !existingIds.has(p.id))
                        return [...prev, ...newProducts]
                    })
                }

                setHasMore(data.length === 40)
            } catch (error) {
                console.error('Failed to fetch products:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [page, debouncedSearch, selectedCategory])

    // Reset page on category change
    useEffect(() => {
        setPage(1)
    }, [selectedCategory])

    // Load cart from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY)
            if (saved) setCart(JSON.parse(saved))
        } catch { }
    }, [])

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    }, [cart])

    // Load contractor profile
    useEffect(() => {
        if (user) fetchContractorProfile()
    }, [user])

    // Evaluate cart with B2B pricing (debounced)
    useEffect(() => {
        if (evaluateTimeoutRef.current) clearTimeout(evaluateTimeoutRef.current)

        if (cart.length === 0 || !user?.id) {
            setEvaluatedCart(null)
            return
        }

        evaluateTimeoutRef.current = setTimeout(() => {
            evaluateCartPricing()
        }, 600)

        return () => {
            if (evaluateTimeoutRef.current) clearTimeout(evaluateTimeoutRef.current)
        }
    }, [cart, user])

    // ═════════════════════════════════════════════════════════════════════════
    // API Calls
    // ═════════════════════════════════════════════════════════════════════════

    const fetchContractorProfile = async () => {
        try {
            const response = await fetchWithAuth('/api/contractors/profile')
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data) {
                    const profile = data.data
                    setCreditLimit(profile.creditLimit || 0)
                    setAvailableCredit(profile.availableCredit || 0)
                }
            }
        } catch (error) {
            console.error('Error fetching contractor profile:', error)
        }
    }

    const evaluateCartPricing = async () => {
        setEvaluating(true)
        try {
            const response = await fetchWithAuth('/api/pricing/evaluate-cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map(i => ({
                        productId: i.product.id,
                        quantity: i.quantity
                    })),
                    customerId: user?.id
                })
            })
            const data = await response.json()
            if (data.success && data.data) {
                setEvaluatedCart(data.data)
            }
        } catch (error) {
            console.error('Error evaluating cart:', error)
        } finally {
            setEvaluating(false)
        }
    }

    const fetchHistory = async () => {
        setIsHistoryOpen(true)
        try {
            const res = await fetchWithAuth('/api/contractors/orders?limit=10')
            const data = await res.json()
            if (res.ok && data.success) {
                setRecentOrders(data.data?.data || data.data || [])
            } else {
                toast.error('Lỗi tải lịch sử đơn hàng')
            }
        } catch {
            toast.error('Lỗi kết nối khi tải lịch sử')
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Cart Actions
    // ═════════════════════════════════════════════════════════════════════════

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { product, quantity: 1 }]
        })
        toast.success(`Đã thêm: ${product.name}`, { duration: 1000 })
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta
                if (newQty <= 0) return item // don't go below 1 via delta
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const setQuantity = (productId: string, qty: number) => {
        if (qty <= 0) {
            removeFromCart(productId)
            return
        }
        setCart(prev => prev.map(item =>
            item.product.id === productId ? { ...item, quantity: qty } : item
        ))
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId))
    }

    const clearCart = () => {
        setCart([])
        setEvaluatedCart(null)
    }

    // Cart quantities map for ProductGrid badges
    const cartQuantities: Record<string, number> = {}
    cart.forEach(item => {
        cartQuantities[item.product.id] = item.quantity
    })

    // ═════════════════════════════════════════════════════════════════════════
    // Checkout
    // ═════════════════════════════════════════════════════════════════════════

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Giỏ hàng trống!')
            return
        }

        setIsProcessing(true)
        const toastId = toast.loading('Đang tạo đơn hàng...')

        try {
            const response = await fetchWithAuth('/api/contractors/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        productId: item.product.id,
                        quantity: item.quantity
                    })),
                    projectName,
                    poNumber,
                    notes: [
                        notes,
                        deliveryDate ? `Giao ngày: ${deliveryDate}` : '',
                        shippingFee > 0 ? `Phí VC: ${formatCurrency(shippingFee)}` : ''
                    ].filter(Boolean).join(' | ') || undefined
                })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                toast.dismiss(toastId)

                const order = data.data
                const orderNumber = order?.orderNumber || order?.id?.slice(-8) || 'B2B-' + Date.now()

                // Build success order data
                const subtotal = evaluatedCart?.summary?.totalOriginal
                    ?? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
                const discountTotal = evaluatedCart?.summary?.totalDiscount ?? 0
                const total = evaluatedCart?.summary?.totalPrice
                    ?? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

                setSuccessOrder({
                    id: order?.id || 'N/A',
                    orderNumber,
                    projectName,
                    items: cart.map(item => {
                        const evaluated = evaluatedCart?.items?.find(i => i.productId === item.product.id)
                        return {
                            name: item.product.name,
                            quantity: item.quantity,
                            unitPrice: item.product.price,
                            effectivePrice: evaluated?.effectivePrice ?? item.product.price,
                            total: evaluated?.totalPrice ?? (item.product.price * item.quantity)
                        }
                    }),
                    subtotal,
                    discountTotal,
                    total,
                    createdAt: new Date().toISOString()
                })

                // Reset
                clearCart()
                setProjectName('')
                setPoNumber('')
                setNotes('')
                setShippingFee(0)
                setDeliveryDate('')
            } else {
                toast.error(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.', { id: toastId })
            }
        } catch (error) {
            console.error('Checkout error:', error)
            toast.error('Lỗi kết nối khi đặt hàng', { id: toastId })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleNewOrder = () => {
        setSuccessOrder(null)
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Render
    // ═════════════════════════════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="flex h-[calc(100vh-73px)] gap-5 p-5 animate-in fade-in duration-500">

                    {/* Left: Product Grid */}
                    <ProductGrid
                        products={products}
                        loading={loading}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        onAddToCart={addToCart}
                        hasMore={hasMore}
                        onLoadMore={() => setPage(p => p + 1)}
                        cartQuantities={cartQuantities}
                    />

                    {/* Right: Cart + Checkout */}
                    <CartPanel
                        cart={cart}
                        evaluatedCart={evaluatedCart}
                        evaluating={evaluating}
                        onUpdateQuantity={updateQuantity}
                        onSetQuantity={setQuantity}
                        onRemoveItem={removeFromCart}
                        onClearCart={clearCart}
                        onCheckout={handleCheckout}
                        isProcessing={isProcessing}
                        projectName={projectName}
                        onProjectNameChange={setProjectName}
                        poNumber={poNumber}
                        onPoNumberChange={setPoNumber}
                        notes={notes}
                        onNotesChange={setNotes}
                        creditLimit={creditLimit}
                        availableCredit={availableCredit}
                        shippingFee={shippingFee}
                        onShippingFeeChange={setShippingFee}
                        deliveryDate={deliveryDate}
                        onDeliveryDateChange={setDeliveryDate}
                        onOpenHistory={fetchHistory}
                    />
                </div>
            </main>

            {/* Success Modal */}
            <SuccessModal
                order={successOrder}
                onClose={handleNewOrder}
                formatCurrency={formatCurrency}
            />

            {/* History Modal */}
            <OrderHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                orders={recentOrders}
                formatCurrency={formatCurrency}
            />
        </div>
    )
}
