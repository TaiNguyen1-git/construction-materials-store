import { useState, useEffect, useRef } from 'react'
import { fetchWithAuth } from '@/lib/api-client'
import { Search, Loader2 } from 'lucide-react'

interface Product {
    id: string
    name: string
    price: number
    unit: string
}

interface Props {
    value: string
    onChange: (productId: string, product: Product | null) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    initialProductName?: string
}

export default function ProductAutocomplete({ value, onChange, placeholder = "Tìm kiếm sản phẩm...", className, disabled, initialProductName }: Props) {
    const [query, setQuery] = useState(initialProductName || '')
    const [options, setOptions] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (value && !selectedProduct && value !== (selectedProduct as Product | null)?.id) {
            // Ideally we would fetch single product if we just have ID, but we skip it here and assume parent passes it initially or it's empty
        }
    }, [value])

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) {
                fetchProducts(query)
            }
        }, 400)
        return () => clearTimeout(timer)
    }, [query, isOpen])

    const fetchProducts = async (searchTerm: string) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('limit', '20')
            if (searchTerm) params.append('search', searchTerm)
            const res = await fetchWithAuth(`/api/products?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                const arr = Array.isArray(data.data?.data || data.data || data) ? data.data?.data || data.data || data : []
                setOptions(arr)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div
                className={`flex items-center w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/20 ${className}`}
                onClick={() => setIsOpen(true)}
            >
                <Search className={`w-4 h-4 mr-2 shrink-0 ${disabled ? 'text-slate-300' : 'text-slate-400'}`} />
                <input
                    type="text"
                    className="w-full border-none bg-transparent p-0 text-sm font-bold text-slate-900 focus:ring-0 disabled:text-slate-500"
                    placeholder={selectedProduct ? selectedProduct.name : placeholder}
                    value={query}
                    disabled={disabled}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                        if (selectedProduct) {
                            setSelectedProduct(null)
                        }
                    }}
                    onFocus={() => {
                        if (!disabled) setIsOpen(true)
                    }}
                />
                {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0 ml-2" />}
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto w-max max-w-[400px]">
                    {options.length === 0 && !loading ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                            Không tìm thấy sản phẩm hợp lệ
                        </div>
                    ) : (
                        options.map(p => (
                            <div
                                key={p.id}
                                className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50/50 last:border-0"
                                onClick={() => {
                                    setSelectedProduct(p)
                                    onChange(p.id, p)
                                    setQuery(p.name)
                                    setIsOpen(false)
                                }}
                            >
                                <div className="text-sm font-bold text-slate-900 truncate">{p.name}</div>
                                <div className="text-xs text-slate-500">{p.price.toLocaleString('vi-VN')}đ / {p.unit}</div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
