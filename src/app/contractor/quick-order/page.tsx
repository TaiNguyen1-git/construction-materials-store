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
import { 
    LayoutGrid, ShoppingCart, Plus, Minus, X, Trash2,
    Zap, Package, Truck, ChevronDown, ChevronUp,
    CreditCard, History, Calendar, FileText,
    Building2, Loader2, MapPin, Info, Gift,
    Pause, Save, Banknote, Layers, Cpu, Activity, ArrowLeft
} from 'lucide-react'

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
    const [drafts, setDrafts] = useState<any[]>([])

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
            
            const savedDrafts = localStorage.getItem('contractor-order-drafts')
            if (savedDrafts) setDrafts(JSON.parse(savedDrafts))
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
                return data.data
            }
        } catch {} finally {
            setEvaluating(false)
        }
        return null
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

    const handleCheckout = async (paymentMethod: 'CREDIT' | 'TRANSFER' = 'CREDIT') => {
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
        const toastId = toast.loading('Đang khởi tạo đơn hàng...')

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
                    paymentMethod: paymentMethod === 'TRANSFER' ? 'BANK_TRANSFER' : 'CREDIT',
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
                
                setSuccessOrder({ 
                    id: order?.id || 'N/A', 
                    orderNumber, 
                    projectName: projectName || selectedProject?.title || '', 
                    items: cart.map(item => { 
                        const evaluated = evaluatedCart?.items?.find(i => i.productId === item.product.id); 
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
                    shippingFee, 
                    total, 
                    paymentMethod,
                    createdAt: new Date().toISOString() 
                })
                
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

    const handleSaveDraft = () => {
        if (cart.length === 0) return
        const label = selectedProject?.title || projectName || `Đơn nháp #${drafts.length + 1}`
        const newDraft = {
            id: Date.now().toString(),
            label,
            cart: [...cart],
            selectedProject,
            projectName,
            poNumber,
            notes,
            deliveryDate,
            savedAt: new Date().toISOString()
        }
        const updated = [newDraft, ...drafts]
        setDrafts(updated)
        localStorage.setItem('contractor-order-drafts', JSON.stringify(updated))
        toast.success(`Đã lưu nháp: ${label}`)
    }

    const handleLoadDraft = (draft: any) => {
        setCart(draft.cart)
        if (draft.selectedProject) setSelectedProject(draft.selectedProject)
        if (draft.projectName) setProjectName(draft.projectName)
        if (draft.poNumber) setPoNumber(draft.poNumber)
        if (draft.notes) setNotes(draft.notes)
        if (draft.deliveryDate) setDeliveryDate(draft.deliveryDate)
        toast.success(`Đã mở bản nháp: ${draft.label}`)
    }

    const handleDeleteDraft = (id: string) => {
        const updated = drafts.filter(d => d.id !== id)
        setDrafts(updated)
        localStorage.setItem('contractor-order-drafts', JSON.stringify(updated))
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in duration-1000">
            <Toaster position="top-right" />
            
            {/* 1. POS Control Bar (STICKY TOP) */}
            <div className="bg-indigo-600 px-8 py-4 text-white flex items-center justify-between relative overflow-hidden shrink-0 shadow-lg z-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50"></div>
                <div className="relative z-10 flex items-center gap-5">
                    <button 
                        onClick={() => router.back()}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tighter leading-none flex items-center gap-2">
                            TRUNG TÂM MUA SẮM VẬT TƯ
                            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                        </h1>
                        <p className="text-[9px] text-indigo-100 font-bold uppercase tracking-[0.2em] opacity-80 mt-1">
                            Hệ thống POS B2B trực tuyến • Bảo mật 100%
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <div className="hidden xl:flex flex-col items-end mr-4">
                        <span className="text-[9px] font-black uppercase text-indigo-200 tracking-widest leading-none mb-1">Hạn mức khả dụng</span>
                        <span className="text-xl font-black text-emerald-400 leading-none tabular-nums">
                            {formatCurrency(availableCredit)}
                        </span>
                    </div>

                    <button 
                        onClick={fetchHistory}
                        className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-md active:scale-95"
                    >
                        Lịch sử
                    </button>
                    <button 
                        onClick={() => router.push('/contractor')}
                        className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-400 transition-all active:scale-95 border border-indigo-400/50"
                    >
                        Thoát
                    </button>
                </div>
            </div>

            {/* 2. Main Interface Area (FLEX-1 MIN-H-0) */}
            <div className="flex-1 flex min-h-0 overflow-hidden bg-slate-50/30">
                {/* Left: Product Selection */}
                <div className="flex-[1.8] flex flex-col min-h-0 overflow-hidden p-4 lg:p-6">
                    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
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
                </div>

                {/* Right: Cart + Checkout (STICKY SIDEBAR) */}
                <div className="w-full lg:w-[480px] flex-shrink-0 flex flex-col min-h-0 border-l border-slate-100">
                    <CartPanel
                        cart={cart}
                        evaluatedCart={evaluatedCart}
                        evaluating={evaluating}
                        isProcessing={isProcessing}
                        projectName={projectName}
                        onProjectNameChange={setProjectName}
                        poNumber={poNumber}
                        onPoNumberChange={setPoNumber}
                        notes={notes}
                        onNotesChange={setNotes}
                        deliveryDate={deliveryDate}
                        onDeliveryDateChange={setDeliveryDate}
                        onRemoveItem={removeFromCart}
                        onUpdateQuantity={updateQuantity}
                        onSetQuantity={(id, qty) => setCart(prev => prev.map(item => item.product.id === id ? { ...item, quantity: qty } : item))}
                        onClearCart={clearCart}
                        onCheckout={handleCheckout}
                        projects={projects}
                        selectedProject={selectedProject}
                        onSelectProject={setSelectedProject}
                        shippingCalc={shippingCalc}
                        shippingLoading={shippingLoading}
                        creditLimit={creditLimit}
                        availableCredit={availableCredit}
                        onOpenHistory={fetchHistory}
                        onSaveDraft={handleSaveDraft}
                        onLoadDraft={handleLoadDraft}
                        drafts={drafts}
                        onDeleteDraft={handleDeleteDraft}
                    />
                </div>
            </div>

            <SuccessModal order={successOrder} onClose={() => setSuccessOrder(null)} formatCurrency={formatCurrency} />
            <OrderHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} orders={recentOrders} formatCurrency={formatCurrency} />
        </div>
    )
}
