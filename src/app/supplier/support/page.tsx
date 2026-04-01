'use client'

import { useState, useEffect, useCallback } from 'react'
import { LifeBuoy, Plus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { SupplierTicket } from './types'
import TicketDetailView from './components/TicketDetailView'
import TicketStatsFilters from './components/TicketStatsFilters'
import TicketGrid from './components/TicketGrid'
import CreateTicketModal from './components/CreateTicketModal'

export default function SupplierSupportUpgraded() {
    const [tickets, setTickets] = useState<SupplierTicket[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewModal, setShowNewModal] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<SupplierTicket | null>(null)
    const [newComment, setNewComment] = useState('')
    const [sending, setSending] = useState(false)
    const [statusFilter, setStatusFilter] = useState('')
    const [search, setSearch] = useState('')

    // Create form
    const [formData, setFormData] = useState({
        reason: '',
        description: '',
        category: '',
        orderId: '',
        priority: 'MEDIUM'
    })

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true)
            const supplierId = localStorage.getItem('supplier_id')
            const params = new URLSearchParams()
            if (supplierId) params.set('supplierId', supplierId)
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetch(`/api/supplier/support?${params}`)
            const data = await res.json()
            if (data.success) setTickets(data.data || [])
        } catch (error) {
            console.error('Fetch tickets failed')
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    const fetchTicketDetails = async (id: string) => {
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/support/${id}?supplierId=${supplierId}`)
            const data = await res.json()
            if (data.success) {
                setSelectedTicket(data.data)
            }
        } catch (error) {
            console.error('Fetch ticket details failed')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch('/api/supplier/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, supplierId })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã gửi yêu cầu hỗ trợ!')
                setShowNewModal(false)
                setFormData({ reason: '', description: '', category: '', orderId: '', priority: 'MEDIUM' })
                fetchTickets()
            }
        } catch (error) {
            toast.error('Lỗi khi gửi yêu cầu')
        }
    }

    const sendComment = async () => {
        if (!selectedTicket || !newComment.trim()) return
        setSending(true)
        try {
            const supplierId = localStorage.getItem('supplier_id')
            const res = await fetch(`/api/supplier/support/${selectedTicket.id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment, supplierId })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Đã gửi phản hồi')
                setNewComment('')
                fetchTicketDetails(selectedTicket.id)
            }
        } catch (error) {
            toast.error('Không thể gửi phản hồi')
        } finally {
            setSending(false)
        }
    }

    useEffect(() => { fetchTickets() }, [fetchTickets])

    const formatRelative = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins} phút trước`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours} giờ trước`
        const days = Math.floor(hours / 24)
        return `${days} ngày trước`
    }

    const filteredTickets = tickets.filter(t => {
        if (search) {
            const q = search.toLowerCase()
            if (!t.reason.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false
        }
        return true
    })

    // Detail view
    if (selectedTicket) {
        return (
            <TicketDetailView 
                selectedTicket={selectedTicket}
                setSelectedTicket={setSelectedTicket}
                formatRelative={formatRelative}
                newComment={newComment}
                setNewComment={setNewComment}
                sendComment={sendComment}
                sending={sending}
            />
        )
    }

    // List view
    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200">
                            <LifeBuoy className="w-6 h-6 text-white" />
                        </div>
                        Trung tâm Hỗ trợ NCC
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Gửi yêu cầu hoặc khiếu nại trực tiếp tới SmartBuild</p>
                </div>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="group bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 flex items-center gap-3 transition-all shadow-xl shadow-blue-200 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-bold text-sm">Mở yêu cầu mới</span>
                </button>
            </div>

            {/* Ticket Stats & Filters */}
            <TicketStatsFilters 
                tickets={tickets}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                search={search}
                setSearch={setSearch}
            />

            {/* Tickets Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <TicketGrid 
                    filteredTickets={filteredTickets}
                    setSelectedTicket={setSelectedTicket}
                    fetchTicketDetails={fetchTicketDetails}
                    formatRelative={formatRelative}
                />
            )}

            {/* Create Ticket Modal */}
            <CreateTicketModal 
                show={showNewModal}
                onClose={() => setShowNewModal(false)}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
            />
        </div>
    )
}
