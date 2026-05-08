'use client'

import { useState, useEffect, useRef } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'

// Types & Constants
import { ChatMessage } from './types'
import { FAQ_DATA, AI_QUICK_REPLIES } from './constants'

// Components
import { SupportHeader } from './components/SupportHeader'
import { FAQSection } from './components/FAQSection'
import { DisputeManager } from './components/DisputeManager'
import { AIAssistantWidget } from './components/AIAssistantWidget'
import { ContactChannels } from './components/ContactChannels'

export default function ContractorHelpHub() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { user } = useAuth()
    
    // UI State
    const [activeTab, setActiveTab] = useState<'faq' | 'disputes'>('faq')
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedCategory, setExpandedCategory] = useState<number | null>(null)
    const [showChat, setShowChat] = useState(false)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Chào bạn! Tôi là trợ lý AI của SmartBuild. Tôi có thể hỗ trợ bạn về các vấn đề hạn mức tín dụng, quy trình giải ngân Escrow, và các chiến lược giảm thiểu rủi ro. Bạn cần giúp gì không?',
            timestamp: new Date()
        }
    ])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)

    // Disputes State
    const [disputes, setDisputes] = useState<any[]>([])
    const [orders, setOrders] = useState<any[]>([])
    const [loadingDisputes, setLoadingDisputes] = useState(false)
    const [showDisputeForm, setShowDisputeForm] = useState(false)
    const [submittingDispute, setSubmittingDispute] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [mediationStep, setMediationStep] = useState<'form' | 'suggestion' | 'escalate'>('form')
    const [mediationSuggestion, setMediationSuggestion] = useState('')
    const [disputeForm, setDisputeForm] = useState({
        orderId: '',
        targetType: 'STORE' as 'STORE' | 'CUSTOMER',
        reason: '',
        description: '',
        evidence: [] as string[]
    })

    useEffect(() => {
        if (user && activeTab === 'disputes') {
            fetchDisputeData()
        }
    }, [user, activeTab])

    const fetchDisputeData = async () => {
        try {
            setLoadingDisputes(true)
            const profileRes = await fetchWithAuth('/api/contractors/profile')
            const profileJson = await profileRes.json()
            const contractorId = profileJson.data?.id

            if (!contractorId) {
                setLoadingDisputes(false)
                return
            }

            const [disRes, ordRes] = await Promise.all([
                fetchWithAuth(`/api/disputes?contractorId=${contractorId}`),
                fetchWithAuth(`/api/contractors/orders`)
            ])

            if (disRes.ok) setDisputes(await disRes.json())
            
            if (ordRes.ok) {
                const ordData = await ordRes.json()
                const orderList = ordData.data?.orders || ordData.orders || []
                setOrders(orderList)
            }
        } catch (error) {
            console.error('Error fetching resolution data:', error)
        } finally {
            setLoadingDisputes(false)
        }
    }

    const handleAIChat = () => {
        if (!chatInput.trim()) return

        const userMsg: ChatMessage = { role: 'user', content: chatInput.trim(), timestamp: new Date() }
        setChatMessages(prev => [...prev, userMsg])
        setChatLoading(true)

        const query = chatInput.toLowerCase()
        setChatInput('')

        setTimeout(() => {
            let response = 'Tôi chưa hiểu rõ yêu cầu của bạn. Bạn có thể:\n• Xem các câu hỏi thường gặp bên dưới\n• Chuyển sang tab "Khiếu nại" để tạo yêu cầu mới\n• Liên hệ tổng đài hỗ trợ: 1900 68xx'

            for (const [keyword, reply] of Object.entries(AI_QUICK_REPLIES)) {
                if (query.includes(keyword)) {
                    response = reply
                    break
                }
            }

            const aiMsg: ChatMessage = { role: 'assistant', content: response, timestamp: new Date() }
            setChatMessages(prev => [...prev, aiMsg])
            setChatLoading(false)
        }, 800 + Math.random() * 700)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingImage(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetchWithAuth('/api/upload', {
                method: 'POST',
                body: formData,
                headers: {}
            })

            const result = await res.json()
            if (result.success) {
                setDisputeForm(prev => ({
                    ...prev,
                    evidence: [...prev.evidence, result.data.url]
                }))
                toast.success('Đã tải lên bằng chứng thành công')
            }
        } catch (error) {
            toast.error('Không thể tải lên hình ảnh')
        } finally {
            setUploadingImage(false)
        }
    }

    const removeEvidence = (index: number) => {
        setDisputeForm(prev => ({
            ...prev,
            evidence: prev.evidence.filter((_, i) => i !== index)
        }))
    }

    const MEDIATION_SUGGESTIONS: Record<string, string> = {
        'Vật tư kém chất lượng': '🔧 Gợi ý quy trình xử lý:\n\n1. Chụp ảnh/quay phim rõ lỗi của vật tư và gửi qua Chat B2B cho Nhà cung cấp\n2. Yêu cầu "Thu hồi đổi trả" trong vòng 7 ngày làm việc\n3. Nếu đã sử dụng một phần, hãy thương lượng "Khấu trừ thanh toán" cho các lô hàng tiếp theo.',
        'Giao thiếu vật tư': '📦 Gợi ý xử lý vận chuyển:\n\n1. Đối chiếu vận đơn điện tử với số lượng thực tế lúc nhận hàng\n2. Yêu cầu Nhà cung cấp xác nhận thiếu hụt qua hệ thống tin nhắn\n3. Yêu cầu giao bù trong vòng 24-48h hoặc hoàn tiền cho phần còn thiếu.',
        'Giao hàng chậm': '🚛 Gợi ý xử lý tiến độ:\n\n1. Kiểm tra trạng thái "Theo dõi trực tuyến" trong phần Vận chuyển\n2. Nếu chậm >48h so với cam kết, yêu cầu bồi thường phí vận chuyển hoặc giảm giá đơn hàng\n3. Thương lượng ưu tiên cho các đợt giao hàng tiếp theo của dự án.',
        'Sai quy cách vật tư': '📐 Gợi ý xử lý sai lệch:\n\n1. Đối chiếu kích thước vật lý với thông số kỹ thuật trong đơn đặt hàng\n2. Kích hoạt "Yêu cầu thay thế" trong vòng 7 ngày\n3. Giữ nguyên trạng vật tư, không được đưa vào thi công để đảm bảo quyền lợi đổi trả.',
        'Chủ nhà không thanh toán': '💰 Gợi ý thu hồi công nợ:\n\n1. Gửi thông báo "Nhắc nợ chính thức" qua hệ thống tin nhắn SmartBuild\n2. Nếu có sử dụng Escrow, tiền sẽ được giải ngân sau khi nghiệm thu giai đoạn\n3. Trường hợp không dùng Escrow, SmartBuild sẽ hỗ trợ gửi thông báo cảnh báo pháp lý.',
        'Yêu cầu thay đổi ngoài hợp đồng': '📝 Gợi ý xử lý thay đổi:\n\n1. Lập biên bản "Thay đổi thiết kế/Vật tư" cho tất cả các điều chỉnh\n2. Tính toán chi phí phát sinh và cập nhật qua module "Đấu thầu/Hợp đồng"\n3. Chỉ tiến hành thi công khi có xác nhận điện tử từ Chủ đầu tư về chi phí mới.',
    }

    const handleMediationCheck = (e: React.FormEvent) => {
        e.preventDefault()
        const suggestion = MEDIATION_SUGGESTIONS[disputeForm.reason] || `💬 Gợi ý tổng quát:\n\n1. Bắt đầu đối thoại trực tiếp qua kênh Chat B2B tích hợp\n2. Cung cấp đầy đủ hình ảnh, video và biên bản hiện trường\n3. Đề xuất một phương án xử lý cụ thể (giảm giá, đổi trả, gia hạn) để đối phương xem xét.`
        setMediationSuggestion(suggestion)
        setMediationStep('suggestion')
    }

    const handleDisputeSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setSubmittingDispute(true)

        try {
            const profileRes = await fetchWithAuth('/api/contractors/profile')
            const profileJson = await profileRes.json()
            const contractorData = profileJson.data

            const selectedOrder = orders.find(o => o.id === disputeForm.orderId)
            const type = disputeForm.targetType === 'CUSTOMER' ? 'CONTRACTOR_TO_CUSTOMER' : 'CONTRACTOR_TO_STORE'

            const res = await fetchWithAuth('/api/disputes', {
                method: 'POST',
                body: JSON.stringify({
                    orderId: disputeForm.orderId,
                    contractorId: contractorData?.id,
                    customerId: selectedOrder?.customerId,
                    type,
                    reason: disputeForm.reason,
                    description: disputeForm.description,
                    evidence: disputeForm.evidence
                })
            })

            if (res.ok) {
                toast.success('Đã gửi khiếu nại thành công lên trung tâm hòa giải')
                setShowDisputeForm(false)
                setMediationStep('form')
                setDisputeForm({ orderId: '', targetType: 'STORE', reason: '', description: '', evidence: [] })
                fetchDisputeData()
            } else {
                toast.error('Gửi khiếu nại thất bại')
            }
        } catch (error) {
            toast.error('Lỗi kết nối máy chủ')
        } finally {
            setSubmittingDispute(false)
        }
    }

    const filteredFAQs = searchTerm ? FAQ_DATA.map(category => ({
        ...category,
        faqs: category.faqs.filter(faq =>
            faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.faqs.length > 0) : FAQ_DATA

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24 max-w-7xl mx-auto">
            <Toaster position="top-right" />

            <SupportHeader 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
            />

            {activeTab === 'faq' ? (
                <FAQSection 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filteredFAQs={filteredFAQs}
                    expandedCategory={expandedCategory}
                    setExpandedCategory={setExpandedCategory}
                    setActiveTab={setActiveTab}
                />
            ) : (
                <DisputeManager 
                    showDisputeForm={showDisputeForm}
                    setShowDisputeForm={setShowDisputeForm}
                    mediationStep={mediationStep}
                    setMediationStep={setMediationStep}
                    disputeForm={disputeForm}
                    setDisputeForm={setDisputeForm}
                    orders={orders}
                    disputes={disputes}
                    loadingDisputes={loadingDisputes}
                    submittingDispute={submittingDispute}
                    uploadingImage={uploadingImage}
                    fileInputRef={fileInputRef}
                    mediationSuggestion={mediationSuggestion}
                    handleFileUpload={handleFileUpload}
                    removeEvidence={removeEvidence}
                    handleMediationCheck={handleMediationCheck}
                    handleDisputeSubmit={handleDisputeSubmit}
                />
            )}

            <ContactChannels />

            <AIAssistantWidget 
                showChat={showChat}
                setShowChat={setShowChat}
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                chatLoading={chatLoading}
                handleAIChat={handleAIChat}
            />
        </div>
    )
}
