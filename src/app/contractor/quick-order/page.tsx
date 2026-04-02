'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import toast, { Toaster } from 'react-hot-toast'

import { Product, CartItem, EvaluatedCart, SuccessOrderData, ContractorProject, ShippingCalculation } from './types'
import ProductGrid from './components/ProductGrid'
import CartPanel from './components/CartPanel'
import SuccessModal from './components/SuccessModal'
import OrderHistoryModal from './components/OrderHistoryModal'
import { LayoutGrid, ShoppingCart, Zap, Layers, Cpu, Activity, ArrowLeft } from 'lucide-react'

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

const CART_STORAGE_KEY = 'contractor-quick-order-cart'

export default function QuickOrderPage() {
    const { user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialProjectId = searchParams.get('projectId')

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

    // ─── Projects & Shipping ─────────────────────────────────────────────────
    const [projects, setProjects] = useState<ContractorProject[]>([])
    const [selectedProject, setSelectedProject] = useState<ContractorProject | null>(null)
    const [shippingCalc, setShippingCalc] = useState<ShippingCalculation | null>(null)
    const [shippingLoading, setShippingLoading] = useState(false)

    // ─── Project Info ────────────────────────────────────────────────────────
    const [projectName, setProjectName] = useState('')
    const [poNumber, setPoNumber] = useState('')
    const [notes, setNotes] = useState('')
    const [deliveryDate, setDeliveryDate] = useState('')

    // ─── Modals ──────────────────────────────────────────────────────────────
    const [successOrder, setSuccessOrder] = useState<SuccessOrderData | null>(null)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [recentOrders, setRecentOrders] = useState<any[]>([])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(1)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Load categories
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

    useEffect(() => {
        setPage(1)
    }, [selectedCategory])

    useEffect(() => {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY)
            if (saved) setCart(JSON.parse(saved))
        } catch { }
    }, [])

    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    }, [cart])

    useEffect(() => {
        if (user) {
            fetchContractorProfile()
            fetchProjects()
        }
    }, [user])

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

    useEffect(() => {
        if (selectedProject?.lat && selectedProject?.lng) {
            calculateShipping(selectedProject.lat, selectedProject.lng)
        } else {
            setShippingCalc(null)
        }
    }, [selectedProject, evaluatedCart, cart])

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
        } catch {}
    }

    const fetchProjects = async () => {
        try {
            const response = await fetchWithAuth('/api/contractors/projects')
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data) {
                    const allProjects = data.data as ContractorProject[]
                    setProjects(allProjects)
                    if (initialProjectId) {
                        const found = allProjects.find(p => p.id === initialProjectId)
                        if (found) setSelectedProject(found)
                    }
                }
            }
        } catch {}
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
        } catch {} finally {
            setEvaluating(false)
        }
    }

    const calculateShipping = async (lat: number, lng: number) => {
        setShippingLoading(true)
        try {
            const orderTotal = evaluatedCart?.summary?.totalPrice
                ?? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
            const response = await fetch('/api/shipping/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng, orderTotal })
            })
            const data = await response.json()
            if (data.success && data.data) {
                setShippingCalc(data.data)
            }
        } catch {} finally {
            setShippingLoading(false)
        }
    }

    const fetchHistory = async () => {
        setIsHistoryOpen(true)
        try {
            toast.loading('Đang đồng bộ lịch sử đơn hàng...', { duration: 1500 })
            const res = await fetchWithAuth('/api/contractors/orders?limit=10')
            const data = await res.json()
            if (res.ok && data.success) {
                setRecentOrders(data.data?.orders || data.data?.data || [])
            } else {
                toast.error('Lỗi kết nối dữ liệu lịch sử.')
            }
        } catch {
            toast.error('Không thể đồng bộ dữ liệu.')
        }
    }

    const addToCart = (product: Product) => {
        const available = product.inventoryItem?.availableQuantity ?? Number.MAX_SAFE_INTEGER
        const existing = cart.find(item => item.product.id === product.id)
        const currentQty = existing ? existing.quantity : 0
        if (currentQty >= available) {
            toast.error(`Sản phẩm này đã hết hàng: Chỉ còn ${available} sản phẩm`, { duration: 3000 })
            return
        }
        setCart(prev => {
            const itemInPrev = prev.find(item => item.product.id === product.id)
            if (itemInPrev) {
                return prev.map(item =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            }
            return [...prev, { product, quantity: 1 }]
        })
        toast.success(`Đã thêm vào giỏ: ${product.name}`, { duration: 1000 })
    }

    const updateQuantity = (productId: string, delta: number) => {
        const item = cart.find(i => i.product.id === productId)
        if (!item) return
        const available = item.product.inventoryItem?.availableQuantity ?? Number.MAX_SAFE_INTEGER
        if (delta > 0 && item.quantity >= available) {
            toast.error(`Thông báo: Chỉ còn ${available} sản phẩm trong kho`, { duration: 3000 })
            return
        }
        setCart(prev => prev.map(it => {
            if (it.product.id === productId) {
                const nextQty = it.quantity + delta
                if (nextQty <= 0) return it
                return { ...it, quantity: nextQty > available ? available : nextQty }
            }
            return it
        }))
    }

    const setQuantity = (productId: string, qty: number) => {
        if (qty <= 0) {
            removeFromCart(productId)
            return
        }
        const item = cart.find(i => i.product.id === productId)
        if (!item) return
        const available = item.product.inventoryItem?.availableQuantity ?? Number.MAX_SAFE_INTEGER
        if (qty > available) {
            toast.error(`Thông báo: Chỉ còn ${available} sản phẩm trong kho`, { duration: 3000 })
            setCart(prev => prev.map(it => it.product.id === productId ? { ...it, quantity: available } : it))
            return
        }
        setCart(prev => prev.map(it => it.product.id === productId ? { ...it, quantity: qty } : it))
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId))
        toast.success('Đã gỡ sản phẩm khỏi giỏ hàng')
    }

    const clearCart = () => {
        setCart([])
        setEvaluatedCart(null)
        toast.success('Đã làm trống giỏ hàng')
    }

    const cartQuantities: Record<string, number> = {}
    cart.forEach(item => { cartQuantities[item.product.id] = item.quantity })

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Giỏ hàng trống: Vui lòng thêm sản phẩm trước khi thanh toán.')
            return
        }
        if (!deliveryDate) {
            toast.error('Thiếu thông tin: Vui lòng chọn ngày giao hàng dự kiến.', { duration: 3000 })
            return
        }
        if (!selectedProject && !projectName.trim()) {
            toast.error('Thiếu thông tin: Vui lòng chọn hoặc nhập tên công trình nhận hàng.', { duration: 3000 })
            return
        }
        setIsProcessing(true)
        const toastId = toast.loading('Đang khởi tạo đơn hàng B2B...')
        try {
            const shippingFee = shippingCalc?.finalFee ?? 0
            const response = await fetchWithAuth('/api/contractors/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
                    projectName: projectName || selectedProject?.title || '',
                    poNumber,
                    shippingFee,
                    deliveryDate: deliveryDate || undefined,
                    shippingDistance: shippingCalc?.distanceKm || undefined,
                    notes: [notes, deliveryDate ? `Giao ngày: ${deliveryDate}` : '', shippingCalc ? `VC: ${shippingCalc.distanceKm}km / ${formatCurrency(shippingFee)}` : ''].filter(Boolean).join(' | ') || undefined
                })
            })
            const data = await response.json()
            if (response.ok && data.success) {
                toast.dismiss(toastId)
                toast.success('Đặt hàng thành công!')
                const order = data.data
                const orderNumber = order?.orderNumber || order?.id?.slice(-8) || 'B2B-' + Date.now()
                const subtotal = evaluatedCart?.summary?.totalOriginal ?? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
                const discountTotal = evaluatedCart?.summary?.totalDiscount ?? 0
                const total = (evaluatedCart?.summary?.totalPrice ?? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)) + shippingFee
                setSuccessOrder({ id: order?.id || 'N/A', orderNumber, projectName: projectName || selectedProject?.title || '', items: cart.map(item => { const evaluated = evaluatedCart?.items?.find(i => i.productId === item.product.id); return { name: item.product.name, quantity: item.quantity, unitPrice: item.product.price, effectivePrice: evaluated?.effectivePrice ?? item.product.price, total: evaluated?.totalPrice ?? (item.product.price * item.quantity) } }), subtotal, discountTotal, shippingFee, total, createdAt: new Date().toISOString() })
                clearCart(); setProjectName(''); setPoNumber(''); setNotes(''); setDeliveryDate(''); setSelectedProject(null); setShippingCalc(null)
            } else {
                toast.error(data.error?.message || data.message || 'Lỗi đặt hàng: Vui lòng kiểm tra lại.', { id: toastId, duration: 5000 })
            }
        } catch {
            toast.error('Lỗi kết nối: Vui lòng thử lại sau giây lát.', { id: toastId })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50 rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in duration-1000">
            <Toaster position="top-right" />
            
            {/* POS Control Bar */}
            <div className="bg-indigo-600 px-10 py-8 text-white flex items-center justify-between relative overflow-hidden flex-shrink-0 shadow-xl z-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex items-center gap-7">
                    <button 
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all border border-white/10 active:scale-95"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Trung tâm mua sắm vật tư</h1>
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest flex items-center gap-3">
                            <Activity className="w-3 h-3 text-emerald-400" /> Hệ thống POS B2B đang hoạt động • Bảo mật 100%
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="text-right mr-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200 opacity-80">Hạn mức khả dụng</p>
                        <p className="text-2xl font-black italic tracking-tighter text-emerald-300 tabular-nums">{formatCurrency(availableCredit)}</p>
                    </div>
                    <button onClick={fetchHistory} className="px-8 py-4 bg-white text-indigo-600 hover:bg-slate-50 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-black/20 italic active:scale-95">
                        Lịch sử đơn hàng
                    </button>
                    <button onClick={() => router.back()} className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 italic">
                        Thoát hệ thống
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Product Grid */}
                <div className="flex-1 overflow-hidden p-6 lg:p-10 bg-white rounded-br-[4rem] relative">
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
                </div>

                {/* Right: Cart + Checkout */}
                <div className="w-[480px] bg-slate-50/80 border-l border-slate-100 p-6 lg:p-10 overflow-y-auto scrollbar-hide flex flex-col shadow-2xl z-10">
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
                        projects={projects}
                        selectedProject={selectedProject}
                        onSelectProject={setSelectedProject}
                        shippingCalc={shippingCalc}
                        shippingLoading={shippingLoading}
                        deliveryDate={deliveryDate}
                        onDeliveryDateChange={setDeliveryDate}
                        creditLimit={creditLimit}
                        availableCredit={availableCredit}
                        onOpenHistory={fetchHistory}
                    />
                </div>
            </div>

            <SuccessModal order={successOrder} onClose={() => setSuccessOrder(null)} formatCurrency={formatCurrency} />
            <OrderHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} orders={recentOrders} formatCurrency={formatCurrency} />
        </div>
    )
}
