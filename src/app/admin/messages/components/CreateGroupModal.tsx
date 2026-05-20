'use client'

import { useState, useEffect } from 'react'
import { X, Search, Loader2, Users, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'

interface User {
    id: string
    name: string
    email: string
    role: string
}

interface CreateGroupModalProps {
    isOpen: boolean
    onClose: () => void
    onGroupCreated: (newConv: any) => void
    currentUserId: string
}

type TabType = 'staff' | 'contractors' | 'customers' | 'suppliers'

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated, currentUserId }: CreateGroupModalProps) {
    const [groupTitle, setGroupTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    
    // Categorized users
    const [participantsData, setParticipantsData] = useState<{
        staff: User[]
        contractors: User[]
        customers: User[]
        suppliers: User[]
    }>({
        staff: [],
        contractors: [],
        customers: [],
        suppliers: []
    })

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState<TabType>('staff')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (!isOpen) return

        const fetchParticipants = async () => {
            setFetching(true)
            try {
                const res = await fetchWithAuth('/api/chat/participants')
                const json = await res.json()
                if (json.success) {
                    setParticipantsData(json.data)
                } else {
                    toast.error('Không thể tải danh sách người dùng: ' + json.error)
                }
            } catch (err) {
                console.error(err)
                toast.error('Lỗi kết nối tải danh sách người dùng')
            } finally {
                setFetching(false)
            }
        }

        fetchParticipants()
        // Reset state
        setGroupTitle('')
        setSelectedIds([])
        setSearchQuery('')
        setActiveTab('staff')
    }, [isOpen])

    if (!isOpen) return null

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const handleCreate = async () => {
        if (!groupTitle.trim()) {
            toast.error('Vui lòng nhập tên nhóm chat')
            return
        }
        if (selectedIds.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 thành viên tham gia nhóm')
            return
        }

        setLoading(true)
        try {
            const res = await fetchWithAuth('/api/chat/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    isGroup: true,
                    groupTitle: groupTitle.trim(),
                    participantIds: selectedIds
                })
            })

            const json = await res.json()
            if (json.success) {
                toast.success('Tạo nhóm chat thành công!')
                onGroupCreated(json.data)
                onClose()
            } else {
                toast.error('Lỗi: ' + json.message)
            }
        } catch (err) {
            console.error(err)
            toast.error('Lỗi kết nối máy chủ')
        } finally {
            setLoading(false)
        }
    }

    // Get current lists filtered by search
    const currentList = participantsData[activeTab].filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const tabConfig: { key: TabType; label: string; count: number }[] = [
        { key: 'staff', label: 'Nhân viên', count: participantsData.staff.length },
        { key: 'contractors', label: 'Nhà thầu', count: participantsData.contractors.length },
        { key: 'customers', label: 'Khách hàng', count: participantsData.customers.length },
        { key: 'suppliers', label: 'Nhà cung cấp', count: participantsData.suppliers.length },
    ]

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">Tạo nhóm chat đa bên</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Kết nối Admin, Employee, Nhà thầu, Khách hàng & NCC</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto">
                    {/* Group Title input */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên nhóm chat</label>
                        <input
                            type="text"
                            placeholder="Nhập tên nhóm trò chuyện (Ví dụ: Dự án Biên Hòa - SmartBuild)..."
                            value={groupTitle}
                            onChange={(e) => setGroupTitle(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    {/* Search & Filter Tabs */}
                    <div className="flex flex-col gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                            <input
                                type="text"
                                placeholder="Tìm tên hoặc email thành viên..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Tabs list */}
                        <div className="flex border-b border-slate-100 gap-1 overflow-x-auto pb-1 scrollbar-thin">
                            {tabConfig.map(tab => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                        activeTab === tab.key
                                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                    }`}
                                >
                                    {tab.label}
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                        activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="flex-1 min-h-[220px] max-h-[300px] border border-slate-100 rounded-2xl overflow-y-auto bg-slate-50/50 p-2 scrollbar-thin">
                        {fetching ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                <span className="text-xs font-semibold">Đang tải người dùng...</span>
                            </div>
                        ) : currentList.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-xs font-medium">
                                Không tìm thấy thành viên phù hợp
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-1">
                                {currentList.map(user => {
                                    const isSelected = selectedIds.includes(user.id)
                                    return (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => handleToggleSelect(user.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                                                isSelected 
                                                    ? 'bg-blue-50/70 hover:bg-blue-50 border-l-4 border-blue-500' 
                                                    : 'hover:bg-slate-100 border-l-4 border-transparent'
                                            }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-sm">{user.name}</span>
                                                <span className="text-xs text-slate-400 font-medium mt-0.5">{user.email}</span>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                                isSelected 
                                                    ? 'bg-blue-500 border-blue-500 text-white' 
                                                    : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                        Đã chọn: <span className="text-blue-600 font-black">{selectedIds.length}</span> thành viên
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={loading || selectedIds.length === 0}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 ${
                                selectedIds.length === 0 || loading
                                    ? 'bg-slate-400 shadow-none cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10'
                            }`}
                        >
                            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Tạo Nhóm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
