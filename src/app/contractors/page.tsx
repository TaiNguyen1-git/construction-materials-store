'use client'

/**
 * Public Contractor Marketplace - Premium Master-Detail Layout
 * Refactored into modular components for better maintainability.
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Header from '@/components/Header'
import LoginIncentiveModal from '@/components/LoginIncentiveModal'

// Components
import ContractorHero from '@/components/contractors/ContractorHero'
import ContractorFilterBar from '@/components/contractors/ContractorFilterBar'
import ContractorCard from '@/components/contractors/ContractorCard'
import ContractorDetail from '@/components/contractors/ContractorDetail'
import ComparisonBar from '@/components/contractors/ComparisonBar'
import GuestChatModal from '@/components/contractors/GuestChatModal'

// Types & Config
import { CATEGORIES, Contractor } from '@/components/contractors/types'

function ContractorMarketplaceContent() {
    const [loading, setLoading] = useState(true)
    const [contractors, setContractors] = useState<Contractor[]>([])
    const [filter, setFilter] = useState('all')
    const [cityFilter, setCityFilter] = useState('Toàn quốc')
    const [searchTerm, setSearchTerm] = useState('')
    const [showLoginModal, setShowLoginModal] = useState(false)
    const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null)
    const searchParams = useSearchParams()

    // Comparison State
    const [compareList, setCompareList] = useState<Contractor[]>([])

    // Chat Feature
    const [showChatModal, setShowChatModal] = useState(false)
    const [guestContact, setGuestContact] = useState({ name: '', phone: '', message: '' })
    const [chatContractorId, setChatContractorId] = useState<string | null>(null)
    const [isLocationOpen, setIsLocationOpen] = useState(false)
    const [isSortOpen, setIsSortOpen] = useState(false)
    const [sortBy, setSortBy] = useState('Mặc định')
    const router = useRouter()

    const handleChatClick = (id: string) => {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || sessionStorage.getItem('access_token')) : null
        if (token) {
            router.push(`/messages?partnerId=${id}`)
        } else {
            setChatContractorId(id)
            setShowChatModal(true)
        }
    }

    const handleGuestSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!guestContact.name || !guestContact.phone || !chatContractorId) return

        try {
            const contractor = contractors.find(c => c.id === chatContractorId)
            let guestId = localStorage.getItem('user_id')
            if (!guestId || !guestId.startsWith('guest_')) {
                guestId = 'guest_' + Math.random().toString(36).substr(2, 9)
                localStorage.setItem('user_id', guestId)
            }
            localStorage.setItem('user_name', guestContact.name)
            localStorage.setItem('user_phone', guestContact.phone)

            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: guestId,
                    senderName: guestContact.name,
                    recipientId: chatContractorId,
                    recipientName: contractor?.displayName || 'Nhà thầu',
                    initialMessage: guestContact.message || `Tôi quan tâm đến dịch vụ của bạn. SĐT liên hệ: ${guestContact.phone}`
                })
            })

            if (res.ok) {
                toast.success('Đang kết nối với nhà thầu...')
                setShowChatModal(false)
                router.push(`/messages?partnerId=${chatContractorId}`)
            } else {
                toast.error('Không thể khởi tạo cuộc trò chuyện')
            }
        } catch (error) {
            console.error('Guest chat error:', error)
            toast.error('Lỗi hệ thống khi kết nối')
        }
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.location-dropdown')) setIsLocationOpen(false);
            if (!target.closest('.sort-dropdown')) setIsSortOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const q = searchParams.get('q')
        const location = searchParams.get('location')
        if (q) setSearchTerm(q)
        if (location) setCityFilter(location)
    }, [searchParams])

    useEffect(() => {
        fetchContractors()
    }, [filter, cityFilter])

    const fetchContractors = async () => {
        setLoading(true)
        try {
            let url = '/api/contractors/public?'
            if (filter !== 'all') {
                const category = CATEGORIES.find(c => c.id === filter)
                const skillQuery = category?.dbValue || filter
                url += `skill=${encodeURIComponent(skillQuery)}&`
            }
            if (cityFilter !== 'Toàn quốc') url += `city=${encodeURIComponent(cityFilter)}&`

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                const list = data.data || []
                setContractors(list)
                if (list.length > 0 && !selectedContractorId) {
                    setSelectedContractorId(list[0].id)
                }
            }
        } catch (err) {
            toast.error('Lỗi khi tải danh sách đối tác')
        } finally {
            setLoading(false)
        }
    }

    const filteredContractors = contractors
        .filter(c =>
            c.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'Đánh giá cao nhất') return (Number(b.avgRating) || 0) - (Number(a.avgRating) || 0)
            if (sortBy === 'Kinh nghiệm lâu năm') return (Number(b.experienceYears) || 0) - (Number(a.experienceYears) || 0)
            return 0
        })

    const selectedContractor = contractors.find(c => c.id === selectedContractorId)

    const toggleCompare = (contractor: Contractor) => {
        if (compareList.find(c => c.id === contractor.id)) {
            setCompareList(compareList.filter(c => c.id !== contractor.id))
        } else {
            if (compareList.length >= 3) {
                toast.error('Chỉ có thể so sánh tối đa 3 nhà thầu')
                return
            }
            setCompareList([...compareList, contractor])
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24 selection:bg-primary-100 selection:text-primary-900">
            <Toaster position="top-right" />
            <Header />

            <ContractorHero 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                cityFilter={cityFilter}
                setCityFilter={setCityFilter}
                isLocationOpen={isLocationOpen}
                setIsLocationOpen={setIsLocationOpen}
            />

            <ContractorFilterBar 
                filter={filter}
                setFilter={setFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                isSortOpen={isSortOpen}
                setIsSortOpen={setIsSortOpen}
            />

            <main className="max-w-[1400px] mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: List */}
                    <div className="w-full lg:w-[450px] space-y-4">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                            Kết quả tìm kiếm ({filteredContractors.length})
                        </h2>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-40 bg-white rounded-3xl animate-pulse border border-slate-100"></div>
                                ))}
                            </div>
                        ) : filteredContractors.length === 0 ? (
                            <div className="bg-white rounded-[40px] p-12 text-center border-2 border-dashed border-slate-200">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold">Không tìm thấy nhà thầu phù hợp</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[1200px] overflow-y-auto no-scrollbar pr-2">
                                {filteredContractors.map((c) => (
                                    <ContractorCard 
                                        key={c.id}
                                        contractor={c}
                                        isSelected={selectedContractorId === c.id}
                                        onSelect={setSelectedContractorId}
                                        isCompared={compareList.some(item => item.id === c.id)}
                                        onToggleCompare={toggleCompare}
                                        onFavorite={() => setShowLoginModal(true)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Detail View */}
                    <div className="flex-1 hidden lg:block">
                        {selectedContractor ? (
                            <ContractorDetail 
                                contractor={selectedContractor}
                                compareList={compareList}
                                toggleCompare={toggleCompare}
                                onFavorite={() => setShowLoginModal(true)}
                                onChat={handleChatClick}
                                similarContractors={contractors.filter(c => c.id !== selectedContractor.id).slice(0, 3)}
                                onSelectSimilar={setSelectedContractorId}
                            />
                        ) : (
                            <div className="sticky top-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100 h-[600px] flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 text-slate-200">
                                    <Users className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">Chọn nhà thầu</h3>
                                <p className="text-slate-400 font-medium text-sm max-w-xs">Chọn một đối tác từ danh sách bên trái để xem hồ sơ năng lực chi tiết</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <ComparisonBar 
                compareList={compareList}
                onClear={() => setCompareList([])}
            />

            <LoginIncentiveModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                feature="general"
                title="Lưu Hồ Sơ Nhà Thầu"
                description="Đăng nhập để lưu danh sách đối tác yêu thích, so sánh hồ sơ và nhận thông báo khi có dự án mới."
            />

            {showChatModal && (
                <GuestChatModal 
                    onClose={() => setShowChatModal(false)} 
                    onSubmit={handleGuestSubmit} 
                    contact={guestContact} 
                    setContact={setGuestContact} 
                />
            )}
        </div>
    )
}

export default function ContractorMarketplace() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-blue-600 uppercase tracking-[0.3em]">Đang tải dữ liệu...</div>}>
            <ContractorMarketplaceContent />
        </Suspense>
    )
}
