import { useState, useEffect, useRef } from 'react'
import { fetchWithAuth } from '@/lib/api-client'
import { Search, Loader2 } from 'lucide-react'

interface Customer {
    id: string
    name?: string
    user?: {
        name: string
    }
}

interface Props {
    value: string
    onChange: (customerId: string, customer: Customer | null) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    initialCustomerName?: string
}

export default function CustomerAutocomplete({ value, onChange, placeholder = "Tìm kiếm khách hàng...", className, disabled, initialCustomerName }: Props) {
    const [query, setQuery] = useState(initialCustomerName || '')
    const [options, setOptions] = useState<Customer[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (value && !selectedCustomer && value !== (selectedCustomer as Customer | null)?.id) {
            // Ideally fetch single customer if we just have ID
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
                fetchCustomers(query)
            }
        }, 400)
        return () => clearTimeout(timer)
    }, [query, isOpen])

    const fetchCustomers = async (searchTerm: string) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('limit', '20')
            if (searchTerm) params.append('search', searchTerm)
            const res = await fetchWithAuth(`/api/customers?${params.toString()}`)
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
                    placeholder={selectedCustomer ? (selectedCustomer.user?.name || selectedCustomer.name) : placeholder}
                    value={query}
                    disabled={disabled}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                        if (selectedCustomer) {
                            setSelectedCustomer(null)
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
                            Không tìm thấy khách hàng
                        </div>
                    ) : (
                        options.map(c => {
                            const displayName = c.user?.name || c.name || 'Anonymous'
                            return (
                                <div
                                    key={c.id}
                                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50/50 last:border-0"
                                    onClick={() => {
                                        setSelectedCustomer(c)
                                        onChange(c.id, c)
                                        setQuery(displayName)
                                        setIsOpen(false)
                                    }}
                                >
                                    <div className="text-sm font-bold text-slate-900 truncate">{displayName}</div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
