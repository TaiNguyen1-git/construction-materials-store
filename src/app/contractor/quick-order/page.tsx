'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'
import toast from 'react-hot-toast'

import { Product, CartItem, EvaluatedCart, SuccessOrderData, ContractorProject, ShippingCalculation } from './types'
import ProductGrid from './components/ProductGrid'
import CartPanel from './components/CartPanel'
import SuccessModal from './components/SuccessModal'
import OrderHistoryModal from './components/OrderHistoryModal'
import { LayoutGrid, ShoppingCart, Zap, Layers, Cpu, Activity } from 'lucide-react'

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
            const res = await fetchWithAuth('/api/contractors/orders?limit=10')
            const data = await res.json()
            if (res.ok && data.success) {
                setRecentOrders(data.data?.orders || data.data?.data || [])
            } else {
                toast.error('Telemetry Sync Failure')
            }
        } catch {
            toast.error('Sync Timeout')
        }
    }

    const addToCart = (product: Product) => {
        const available = product.inventoryItem?.availableQuantity ?? Number.MAX_SAFE_INTEGER
        const existing = cart.find(item => item.product.id === product.id)
        const currentQty = existing ? existing.quantity : 0
        if (currentQty >= available) {
            toast.error(`Stock Conflict: Only ${available} available`, { duration: 3000 })
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
        toast.success(`Unit Loaded: ${product.name}`, { duration: 1000 })
    }

    const updateQuantity = (productId: string, delta: number) => {
        const item = cart.find(i => i.product.id === productId)
        if (!item) return
        const available = item.product.inventoryItem?.availableQuantity ?? Number.MAX_SAFE_INTEGER
        if (delta > 0 && item.quantity >= available) {
            toast.error(`Stock Restriction: Only ${available} available`, { duration: 3000 })
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
            toast.error(`Stock Restriction: Only ${available} available`, { duration: 3000 })
            setCart(prev => prev.map(it => it.product.id === productId ? { ...it, quantity: available } : it))
            return
        }
        setCart(prev => prev.map(it => it.product.id === productId ? { ...it, quantity: qty } : it))
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId))
    }

    const clearCart = () => {
        setCart([])
        setEvaluatedCart(null)
    }

    const cartQuantities: Record<string, number> = {}
    cart.forEach(item => { cartQuantities[item.product.id] = item.quantity })

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Cart Empty: Null Transmission Rejected')
            return
        }
        if (!deliveryDate) {
            toast.error('Tactical Error: Selection of Delivery Cycle Required', { duration: 3000 })
            return
        }
        if (!selectedProject && !projectName.trim()) {
            toast.error('Tactical Error: Target Location Node Required', { duration: 3000 })
            return
        }
        setIsProcessing(true)
        const toastId = toast.loading('Synchronizing Order Payload...')
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
                const order = data.data
                const orderNumber = order?.orderNumber || order?.id?.slice(-8) || 'B2B-' + Date.now()
                const subtotal = evaluatedCart?.summary?.totalOriginal ?? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
                const discountTotal = evaluatedCart?.summary?.totalDiscount ?? 0
                const total = (evaluatedCart?.summary?.totalPrice ?? cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)) + shippingFee
                setSuccessOrder({ id: order?.id || 'N/A', orderNumber, projectName: projectName || selectedProject?.title || '', items: cart.map(item => { const evaluated = evaluatedCart?.items?.find(i => i.productId === item.product.id); return { name: item.product.name, quantity: item.quantity, unitPrice: item.product.price, effectivePrice: evaluated?.effectivePrice ?? item.product.price, total: evaluated?.totalPrice ?? (item.product.price * item.quantity) } }), subtotal, discountTotal, shippingFee, total, createdAt: new Date().toISOString() })
                clearCart(); setProjectName(''); setPoNumber(''); setNotes(''); setDeliveryDate(''); setSelectedProject(null); setShippingCalc(null)
            } else {
                toast.error(data.error?.message || data.message || 'Transmission Rejected', { id: toastId, duration: 5000 })
            }
        } catch {
            toast.error('Transmission Timeout', { id: toastId })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50 rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-2xl animate-in fade-in duration-1000">
            {/* POS Control Bar */}
            <div className="bg-slate-900 px-10 py-6 text-white flex items-center justify-between relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                        <ShoppingCart className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl font-black uppercase italic tracking-tighter">Material Management Terminal</h1>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-3 h-3 text-emerald-500" /> POS Mode Active • Operational Integrity: 100%
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="text-right mr-6">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Available Liquid Credit</p>
                        <p className="text-lg font-black italic tracking-tighter text-emerald-400">{formatCurrency(availableCredit)}</p>
                    </div>
                    <button onClick={fetchHistory} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 italic">
                        Node History
                    </button>
                    <button onClick={() => router.back()} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 italic">
                        Exit Matrix
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Product Grid */}
                <div className="flex-1 overflow-hidden p-6 lg:p-8 bg-white rounded-br-[3.5rem] relative">
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
                <div className="w-[450px] bg-slate-50/80 border-l border-slate-100 p-6 lg:p-8 overflow-y-auto scrollbar-hide flex flex-col">
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
