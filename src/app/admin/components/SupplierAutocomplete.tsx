import { useState, useEffect, useRef } from 'react'
import { fetchWithAuth } from '@/lib/api-client'
import { Search, Loader2 } from 'lucide-react'

interface Supplier {
    id: string
    name: string
    code?: string
}

interface Props {
    value: string
    onChange: (supplierId: string, supplier: Supplier | null) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    initialSupplierName?: string
}

export default function SupplierAutocomplete({ value, onChange, placeholder = "Tìm kiếm nhà cung cấp...", className, disabled, initialSupplierName }: Props) {
    const [query, setQuery] = useState(initialSupplierName || '')
    const [options, setOptions] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (value && !selectedSupplier && value !== (selectedSupplier as Supplier | null)?.id) {
            // Ideally fetch single supplier if we just have ID
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
                fetchSuppliers(query)
            }
        }, 400)
        return () => clearTimeout(timer)
    }, [query, isOpen])

    const fetchSuppliers = async (searchTerm: string) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('limit', '20')
            if (searchTerm) params.append('search', searchTerm)
            const res = await fetchWithAuth(`/api/suppliers?${params.toString()}`)
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
                className={`flex items-center w-full bg-slate-50 border-none rounded-3xl px-5 py-3 focus-within:ring-4 focus-within:ring-blue-500/10 ${className}`}
                onClick={() => setIsOpen(true)}
            >
                <Search className={`w-4 h-4 mr-2 shrink-0 ${disabled ? 'text-slate-300' : 'text-slate-400'}`} />
                <input
                    type="text"
                    className="w-full border-none bg-transparent p-0 text-sm font-bold text-slate-900 focus:ring-0 disabled:text-slate-500"
                    placeholder={selectedSupplier ? selectedSupplier.name : placeholder}
                    value={query}
                    disabled={disabled}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                        if (selectedSupplier) {
                            setSelectedSupplier(null)
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
                            Không tìm thấy nhà cung cấp
                        </div>
                    ) : (
                        options.map(s => {
                            return (
                                <div
                                    key={s.id}
                                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50/50 last:border-0 flex justify-between items-center"
                                    onClick={() => {
                                        setSelectedSupplier(s)
                                        onChange(s.id, s)
                                        setQuery(s.name)
                                        setIsOpen(false)
                                    }}
                                >
                                    <div className="text-sm font-bold text-slate-900 truncate">{s.name}</div>
                                    <div className="text-[10px] font-mono font-bold text-slate-400">{s.code}</div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
