'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    PhoneOff,
    Save,
    CheckCircle2,
    MessageSquare,
    Calculator,
    ShieldCheck,
    AlertCircle,
    X,
    Lock,
    Plus,
    Send,
    Image as ImageIcon,
    TrendingDown,
    TrendingUp,
    Activity,
    Clock,
    Upload,
    Maximize2,
    PanelRightOpen,
    PanelRightClose
} from 'lucide-react'
import Peer from 'peerjs'
import { ref, onValue, set, update, push } from 'firebase/database'
import { getFirebaseDatabase } from '@/lib/firebase'
import { toast } from 'react-hot-toast'

interface BoQItem {
    id: string
    description: string
    quantity: number
    unit: string
    unitPrice: number
    totalPrice: number
}

interface ActivityLogEntry {
    id: string
    action: string
    user: string
    role: 'contractor' | 'customer'
    details: string
    timestamp: number
}

interface ChatMessage {
    id: string
    sender: string
    senderRole: 'contractor' | 'customer'
    message: string
    timestamp: number
    type: 'text' | 'image'
    imageUrl?: string
}

interface MaterialImage {
    id: string
    url: string
    caption: string
    uploadedBy: string
    timestamp: number
}

// Helper to make Peer ID safe (alphanumeric, dash, underscore only)
const getSafePeerId = (id: string) => id.replace(/[^a-zA-Z0-9-_]/g, '_')

interface NegotiationState {
    boq: BoQItem[]
    acceptedBy: string[] // List of user IDs
    contractorId: string
    customerId: string
    status: 'negotiating' | 'locked' | 'cancelled'
    lastUpdate: number
    originalTotal?: number // Giá ban đầu để tính % biến động
    activityLog?: ActivityLogEntry[]
    chatMessages?: ChatMessage[]
    materialGallery?: MaterialImage[]
}

interface NegotiationRoomProps {
    quoteId: string
    userId: string
    userName: string
    role: 'contractor' | 'customer'
    initialBoQ: BoQItem[]
}

export default function NegotiationRoom({ quoteId, userId, userName, role, initialBoQ }: NegotiationRoomProps) {
    const router = useRouter()
    // Media States
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [isVideoOn, setIsVideoOn] = useState(true)
    const [isMicOn, setIsMicOn] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [sessionId] = useState(() => Math.random().toString(36).substring(2, 6))

    // Negotiation States
    const [negotiation, setNegotiation] = useState<NegotiationState | null>(null)
    const [peerId, setPeerId] = useState<string>('')
    const [remotePeerId, setRemotePeerId] = useState<string>('')

    // Sidebar & Chat States
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [sidebarTab, setSidebarTab] = useState<'chat' | 'activity' | 'gallery'>('chat')
    const [chatInput, setChatInput] = useState('')
    const [galleryCaption, setGalleryCaption] = useState('')
    const [selectedImage, setSelectedImage] = useState<MaterialImage | null>(null)

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const peerRef = useRef<Peer | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const db = getFirebaseDatabase()

    // 1. Initialize PeerJS (Stable - Let server assign ID to avoid "ID is taken")
    useEffect(() => {
        if (!userId) return
        console.log('[PeerJS] Initializing connection...')

        // Initialize without a specific ID, let server provide one
        const peer = new Peer({
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ]
            }
        })
        peerRef.current = peer

        peer.on('open', (id) => {
            setPeerId(id)
            setIsConnected(true)
            console.log('[PeerJS] Connection ready. My dynamic ID:', id)
        })

        peer.on('disconnected', () => {
            setIsConnected(false)
            console.log('[PeerJS] Disconnected from server')
        })

        peer.on('error', (err) => {
            console.error('[PeerJS] Error:', err)
        })

        peer.on('call', (call) => {
            console.log('[PeerJS] Incoming call from:', call.peer)
            if (localStreamRef.current) {
                console.log('[PeerJS] Answering call')
                call.answer(localStreamRef.current)
                call.on('stream', (remoteStream) => {
                    console.log('[PeerJS] Remote stream received')
                    setRemoteStream(remoteStream)
                })
            }
        })

        return () => {
            console.log('[PeerJS] Cleaning up connection')
            peer.destroy()
        }
    }, [userId])

    // 2. Start Local Stream (Secure context check)
    useEffect(() => {
        const startMedia = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.warn('MediaDevices API not available (likely non-secure context)')
                toast.error('Trình duyệt của bạn không hỗ trợ Camera/Audio trong môi trường này. Hãy thử sử dụng localhost hoặc HTTPS.')
                return
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                setLocalStream(stream)
                localStreamRef.current = stream
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream
                }
                console.log('[Media] Local stream started and attached')
            } catch (err) {
                console.error('Error accessing media devices:', err)
                toast.error('Không thể mở Camera. Vui lòng kiểm tra quyền truy cập.')
            }
        }
        startMedia()
        return () => {
            localStream?.getTracks().forEach(track => {
                track.stop()
                console.log('[Media] Stopped track:', track.kind)
            })
        }
    }, [])

    // 3. Register Peer ID to Firebase (Only once when ready)
    useEffect(() => {
        if (!userId || !db || !peerId) return
        const negotiationRef = ref(db, `negotiations/${quoteId}`)
        const peerField = `${role}PeerId`

        console.log(`[NegotiationRoom] Syning my ID (${peerField}) to Firebase:`, peerId)
        update(negotiationRef, { [peerField]: peerId })

        // Removed cleanup that sets to null, because it causes race conditions on fast-refresh
    }, [userId, db, peerId, quoteId, role])

    // 4. Sync Negotiation State (Firebase)
    useEffect(() => {
        if (!userId || !db) return
        const negotiationRef = ref(db, `negotiations/${quoteId}`)

        const unsubscribe = onValue(negotiationRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                // Important: Only set negotiation state if it has boq data
                if (data.boq) {
                    setNegotiation(data)
                }
            } else {
                // Initialize session if absolutely no data exists
                console.log('Initializing new negotiation session')
                const initialState = {
                    boq: initialBoQ || [],
                    acceptedBy: [],
                    contractorId: role === 'contractor' ? userId : '',
                    customerId: role === 'customer' ? userId : '',
                    status: 'negotiating',
                    lastUpdate: Date.now()
                }
                set(negotiationRef, initialState)
            }
        })

        return () => unsubscribe()
    }, [quoteId, db, userId, role]) // Removed initialBoQ to prevent re-runs

    // 5. Video Call Logic - Simplified and robust
    const hasCalledRef = useRef(false)

    useEffect(() => {
        if (!userId || !db || !localStream) {
            console.log('[VideoCall] Waiting for prerequisites:', { userId: !!userId, db: !!db, localStream: !!localStream })
            return
        }
        if (!peerRef.current) {
            console.log('[VideoCall] Peer not initialized yet')
            return
        }

        console.log('[VideoCall] Setting up Firebase listener for video call')
        const negotiationRef = ref(db, `negotiations/${quoteId}`)

        const unsubscribe = onValue(negotiationRef, (snapshot) => {
            const data = snapshot.val()
            if (!data) {
                console.log('[VideoCall] No data in Firebase')
                return
            }

            // Get the other party's peer ID
            const otherPeerId = role === 'contractor' ? data.customerPeerId : data.contractorPeerId

            console.log(`[VideoCall] My role: ${role}, My ID: ${peerId}, Other ID: ${otherPeerId}`)

            // If we have the other party's ID and haven't called yet
            if (otherPeerId && peerId && !hasCalledRef.current && !remoteStream) {
                console.log('[VideoCall] Attempting to call:', otherPeerId)
                hasCalledRef.current = true
                setRemotePeerId(otherPeerId)

                try {
                    const call = peerRef.current?.call(otherPeerId, localStream)
                    if (call) {
                        console.log('[VideoCall] Call initiated successfully')
                        call.on('stream', (stream) => {
                            console.log('[VideoCall] Received remote stream!')
                            setRemoteStream(stream)
                        })
                        call.on('error', (err) => {
                            console.error('[VideoCall] Call error:', err)
                            hasCalledRef.current = false
                        })
                        call.on('close', () => {
                            console.log('[VideoCall] Call closed')
                            hasCalledRef.current = false
                        })
                    } else {
                        console.log('[VideoCall] Call object not created, peer may not be ready')
                        hasCalledRef.current = false
                    }
                } catch (err) {
                    console.error('[VideoCall] Error initiating call:', err)
                    hasCalledRef.current = false
                }
            }
        })

        return () => {
            console.log('[VideoCall] Cleaning up listener')
            unsubscribe()
        }
    }, [quoteId, db, userId, role, localStream, peerId, remoteStream])

    // Handlers
    const handleUpdateItem = (itemId: string, field: string, value: any) => {
        if (negotiation?.status === 'locked') return

        const currentBoQ = negotiation?.boq || initialBoQ || []
        const newBoQ = currentBoQ.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value }
                if (field === 'quantity' || field === 'unitPrice') {
                    updatedItem.totalPrice = updatedItem.quantity * (updatedItem.unitPrice || 0)
                }
                return updatedItem
            }
            return item
        })

        const negotiationRef = ref(db, `negotiations/${quoteId}`)
        update(negotiationRef, {
            boq: newBoQ,
            acceptedBy: [],
            lastUpdate: Date.now(),
            contractorId: negotiation?.contractorId || (role === 'contractor' ? userId : ''),
            customerId: negotiation?.customerId || (role === 'customer' ? userId : ''),
            status: negotiation?.status || 'negotiating'
        })
    }

    const handleAddItem = () => {
        if (negotiation?.status === 'locked') return

        const newItem: BoQItem = {
            id: `item_${Date.now()}`,
            description: 'Hạng mục mới',
            quantity: 1,
            unit: 'm2',
            unitPrice: 0,
            totalPrice: 0
        }

        const currentBoQ = negotiation?.boq || initialBoQ || []
        const negotiationRef = ref(db, `negotiations/${quoteId}`)

        update(negotiationRef, {
            boq: [...currentBoQ, newItem],
            acceptedBy: [],
            lastUpdate: Date.now(),
            contractorId: negotiation?.contractorId || (role === 'contractor' ? userId : ''),
            customerId: negotiation?.customerId || (role === 'customer' ? userId : ''),
            status: negotiation?.status || 'negotiating'
        })
    }

    const handleRemoveItem = (itemId: string) => {
        if (negotiation?.status === 'locked') return

        const currentBoQ = negotiation?.boq || initialBoQ || []
        const newBoQ = currentBoQ.filter(item => item.id !== itemId)

        const negotiationRef = ref(db, `negotiations/${quoteId}`)
        update(negotiationRef, {
            boq: newBoQ,
            acceptedBy: [],
            lastUpdate: Date.now()
        })
    }

    const handleAccept = () => {
        if (!negotiation) return

        const newAcceptedBy = [...new Set([...(negotiation.acceptedBy || []), userId])]
        const negotiationRef = ref(db, `negotiations/${quoteId}`)

        update(negotiationRef, {
            acceptedBy: newAcceptedBy,
            status: newAcceptedBy.length >= 2 ? 'locked' : 'negotiating'
        })

        if (newAcceptedBy.length >= 2) {
            toast.success('Thỏa thuận thành công! Đang khóa hợp đồng...')
        } else {
            toast.success('Bạn đã xác nhận thỏa thuận. Chờ đối phương...')
        }
    }

    const handleManualCall = () => {
        if (!peerRef.current || !remotePeerId || !localStream) {
            toast.error('Chưa có thông tin đối phương hoặc chưa mở Camera.')
            return
        }
        console.log('[PeerJS] Manual call attempt to:', remotePeerId)
        const call = peerRef.current.call(remotePeerId, localStream)
        if (call) {
            call.on('stream', (remoteStream) => {
                console.log('[PeerJS] Received remote stream (Manual path)')
                setRemoteStream(remoteStream)
            })
        }
    }

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks()[0].enabled = !isVideoOn
            setIsVideoOn(!isVideoOn)
        }
    }

    const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks()[0].enabled = !isMicOn
            setIsMicOn(!isMicOn)
        }
    }

    const handleLeave = () => {
        if (window.confirm('Bạn có chắc chắn muốn rời khỏi phòng thương thảo?')) {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop())
            }
            if (peerRef.current) {
                peerRef.current.destroy()
            }
            const path = role === 'contractor' ? '/contractor/quotes' : '/account/quotes'
            router.push(path)
        }
    }

    // 6. Attach remote stream to video element when it changes
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            console.log('[Video] Attaching remote stream to video element')
            remoteVideoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

    // 7. Auto-scroll chat to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [negotiation?.chatMessages])

    // Chat Handlers
    const handleSendChat = () => {
        if (!chatInput.trim()) return

        const newMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            sender: userName,
            senderRole: role,
            message: chatInput.trim(),
            timestamp: Date.now(),
            type: 'text'
        }

        const currentMessages = negotiation?.chatMessages || []
        const negotiationRef = ref(db, `negotiations/${quoteId}`)
        update(negotiationRef, {
            chatMessages: [...currentMessages, newMessage]
        })

        setChatInput('')
    }

    // Activity Log Handler
    const addActivityLog = (action: string, details: string) => {
        const newEntry: ActivityLogEntry = {
            id: `log_${Date.now()}`,
            action,
            user: userName,
            role,
            details,
            timestamp: Date.now()
        }

        const currentLog = negotiation?.activityLog || []
        const negotiationRef = ref(db, `negotiations/${quoteId}`)
        update(negotiationRef, {
            activityLog: [...currentLog, newEntry]
        })
    }

    // Gallery Handler
    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // For demo, we'll use a placeholder. In production, upload to Firebase Storage
        const fakeUrl = URL.createObjectURL(file)

        const newImage: MaterialImage = {
            id: `img_${Date.now()}`,
            url: fakeUrl,
            caption: galleryCaption || file.name,
            uploadedBy: userName,
            timestamp: Date.now()
        }

        const currentGallery = negotiation?.materialGallery || []
        const negotiationRef = ref(db, `negotiations/${quoteId}`)
        update(negotiationRef, {
            materialGallery: [...currentGallery, newImage]
        })

        setGalleryCaption('')
        addActivityLog('upload_image', `Đã gửi ảnh vật tư: ${newImage.caption}`)
        toast.success('Đã gửi ảnh vật tư!')
    }

    // Computed Values
    const totalAmount = (negotiation?.boq || []).reduce((sum, item) => sum + item.totalPrice, 0)
    const originalTotal = negotiation?.originalTotal || totalAmount
    const priceDifference = originalTotal > 0 ? ((totalAmount - originalTotal) / originalTotal) * 100 : 0
    const formatVND = (amount: number) => amount.toLocaleString('vi-VN')
    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    return (
        <div className="flex flex-col h-screen bg-gray-900 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg">Phòng Thương Thảo Chiến Lược</h1>
                        <p className="text-gray-400 text-xs">Mã báo giá: {quoteId} • Đang kết nối bảo mật</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full border-2 border-gray-800 bg-blue-500 flex items-center justify-center text-[10px] text-white">CN</div>
                        <div className="w-8 h-8 rounded-full border-2 border-gray-800 bg-green-500 flex items-center justify-center text-[10px] text-white">NT</div>
                    </div>
                    <span className="text-gray-400 text-sm">{userName} ({role === 'contractor' ? 'Nhà thầu' : 'Chủ nhà'})</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Video Feeds */}
                <div className="w-72 flex-shrink-0 flex flex-col gap-3 p-3 border-r border-gray-700">
                    {/* Remote Video */}
                    <div className="relative flex-1 bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
                        {remoteStream ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center animate-pulse">
                                    <Video className="w-8 h-8" />
                                </div>
                                <span className="text-sm">Đang chờ đối phương...</span>
                                <button
                                    onClick={handleManualCall}
                                    className="mt-2 text-[10px] text-blue-400 hover:underline"
                                >
                                    Thử kết nối lại
                                </button>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs">
                            Đối tác
                        </div>
                    </div>

                    {/* Local Video */}
                    <div className="relative h-48 bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs">
                            Bạn (Webcam)
                        </div>
                        {!isVideoOn && (
                            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                <VideoOff className="w-12 h-12 text-gray-600" />
                            </div>
                        )}
                    </div>

                    {/* Media Controls */}
                    <div className="flex justify-center gap-4 py-2">
                        <button
                            onClick={toggleMic}
                            className={`p-3 rounded-full transition-all ${isMicOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 text-white'}`}
                        >
                            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className={`p-3 rounded-full transition-all ${isVideoOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 text-white'}`}
                        >
                            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                        </button>
                        <button
                            onClick={handleLeave}
                            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all"
                        >
                            <PhoneOff className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Right Side: BoQ & Negotiation Table */}
                <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-blue-600 p-4 flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-5 h-5" />
                                    <span className="font-bold">Bảng Khối Lượng (BoQ) - Soạn Thảo Trực Tiếp</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    {negotiation?.status !== 'locked' && (
                                        <button
                                            onClick={handleAddItem}
                                            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                                        >
                                            <Plus className="w-4 h-4" /> Thêm hạng mục
                                        </button>
                                    )}
                                    <div className="bg-white/20 px-3 py-1 rounded-full">
                                        {negotiation?.status === 'locked' ? 'Đã Khóa Thỏa Thuận' : 'Đang Chỉnh Sửa'}
                                    </div>
                                </div>
                            </div>

                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Hạng mục</th>
                                        <th className="px-6 py-4 text-center">Khối lượng</th>
                                        <th className="px-6 py-4">ĐVT</th>
                                        <th className="px-6 py-4 text-right">Đơn giá</th>
                                        <th className="px-6 py-4 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 italic">
                                    {(negotiation?.boq || []).map((item) => (
                                        <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                                    disabled={negotiation?.status === 'locked'}
                                                    className="w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none transition-all py-1 font-medium text-gray-900"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="text"
                                                    value={item.quantity.toLocaleString('vi-VN')}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value.replace(/\./g, '').replace(/,/g, '.')) || 0
                                                        handleUpdateItem(item.id, 'quantity', val)
                                                    }}
                                                    disabled={negotiation?.status === 'locked'}
                                                    className="w-20 px-2 py-1 bg-white border border-gray-200 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 font-bold"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                                                    disabled={negotiation?.status === 'locked'}
                                                    className="w-16 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none transition-all py-1 text-center text-gray-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <input
                                                        type="text"
                                                        value={item.unitPrice.toLocaleString('vi-VN')}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value.replace(/\./g, '')) || 0
                                                            handleUpdateItem(item.id, 'unitPrice', val)
                                                        }}
                                                        disabled={negotiation?.status === 'locked'}
                                                        className="w-28 bg-white border border-gray-200 rounded px-2 py-1 text-right focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 font-mono"
                                                    />
                                                    <span className="text-gray-400 text-[10px]">đ</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-600 font-mono relative">
                                                <div className="flex items-center justify-end gap-4">
                                                    {formatVND(item.totalPrice)}đ
                                                    {negotiation?.status !== 'locked' && (
                                                        <button
                                                            onClick={() => handleRemoveItem(item.id)}
                                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!negotiation?.boq || negotiation.boq.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                                <p className="italic mb-4 uppercase text-xs font-bold tracking-widest">Bảng khối lượng đang trống</p>
                                                <button
                                                    onClick={handleAddItem}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md"
                                                >
                                                    <Plus className="w-4 h-4" /> Bắt đầu tạo BoQ
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-blue-50">
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 font-bold text-gray-900 text-right">TỔNG CỘNG:</td>
                                        <td className="px-6 py-4 text-right font-black text-xl text-blue-700">
                                            {formatVND(totalAmount)}đ
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Negotiation Info */}
                        <div className="mt-6 grid grid-cols-2 gap-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4">
                                <ShieldCheck className="w-10 h-10 text-blue-600 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-blue-900">Tính Pháp Lý</h4>
                                    <p className="text-blue-800 text-sm">Khi nhấn "Chấp nhận", hệ thống sẽ lưu vết thỏa thuận để xuất phụ lục hợp đồng chính thức.</p>
                                </div>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-4">
                                <AlertCircle className="w-10 h-10 text-orange-600 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-orange-900">Lưu ý</h4>
                                    <p className="text-orange-800 text-sm">Việc thay đổi khối lượng ảnh hưởng trực tiếp đến tổng giá trị ký quỹ (Escrow).</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-6 bg-white border-t border-gray-200 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${(negotiation?.acceptedBy || []).includes(userId) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`} />
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Bạn: {(negotiation?.acceptedBy || []).includes(userId) ? 'Đã ký' : 'Chưa ký'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${(negotiation?.acceptedBy || []).length >= 2 || ((negotiation?.acceptedBy || []).length === 1 && !(negotiation?.acceptedBy || []).includes(userId)) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300 animate-pulse'}`} />
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Đối tác: {(negotiation?.acceptedBy || []).length >= 2 || ((negotiation?.acceptedBy || []).length === 1 && !(negotiation?.acceptedBy || []).includes(userId)) ? 'Đã ký' : 'Chờ ký...'}</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                {isSidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                            </button>
                            {negotiation?.status === 'locked' ? (
                                <div className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold">
                                    <CheckCircle2 className="w-6 h-6" /> ĐÃ XÁC NHẬN THỎA THUẬN
                                </div>
                            ) : (
                                <button
                                    onClick={handleAccept}
                                    disabled={(negotiation?.acceptedBy || []).includes(userId)}
                                    className={`flex items-center gap-2 px-10 py-3 rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 ${(negotiation?.acceptedBy || []).includes(userId)
                                        ? 'bg-gray-400 cursor-not-allowed text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                >
                                    <CheckCircle2 className="w-6 h-6" />
                                    {(negotiation?.acceptedBy || []).includes(userId) ? 'ĐANG CHỜ ĐỐI TÁC...' : 'CHỐP THỎA THUẬN'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Chat, Activity Log, Gallery */}
                {isSidebarOpen && (
                    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                        {/* Sidebar Tabs */}
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setSidebarTab('chat')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${sidebarTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <MessageSquare className="w-4 h-4 mx-auto mb-1" />
                                Chat
                            </button>
                            <button
                                onClick={() => setSidebarTab('activity')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${sidebarTab === 'activity' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Activity className="w-4 h-4 mx-auto mb-1" />
                                Nhật ký
                            </button>
                            <button
                                onClick={() => setSidebarTab('gallery')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${sidebarTab === 'gallery' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <ImageIcon className="w-4 h-4 mx-auto mb-1" />
                                Vật tư
                            </button>
                        </div>

                        {/* Sidebar Content */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Chat Tab */}
                            {sidebarTab === 'chat' && (
                                <>
                                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {(negotiation?.chatMessages || []).length === 0 ? (
                                            <div className="text-center text-gray-400 py-8">
                                                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                <p className="text-xs">Chưa có tin nhắn</p>
                                            </div>
                                        ) : (
                                            (negotiation?.chatMessages || []).map((msg) => (
                                                <div key={msg.id} className={`flex ${msg.senderRole === role ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl ${msg.senderRole === role ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                                                        <p className="text-sm">{msg.message}</p>
                                                        <p className={`text-[10px] mt-1 ${msg.senderRole === role ? 'text-blue-200' : 'text-gray-400'}`}>{formatTime(msg.timestamp)}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-3 border-t border-gray-100">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                                                placeholder="Nhập tin nhắn..."
                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <button
                                                onClick={handleSendChat}
                                                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Activity Log Tab */}
                            {sidebarTab === 'activity' && (
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {/* Price Difference Card */}
                                    <div className={`p-4 rounded-xl border ${priceDifference < 0 ? 'bg-green-50 border-green-200' : priceDifference > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {priceDifference < 0 ? (
                                                <TrendingDown className="w-5 h-5 text-green-600" />
                                            ) : priceDifference > 0 ? (
                                                <TrendingUp className="w-5 h-5 text-red-600" />
                                            ) : null}
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Biến động giá</span>
                                        </div>
                                        <div className={`text-2xl font-black ${priceDifference < 0 ? 'text-green-600' : priceDifference > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                            {priceDifference > 0 ? '+' : ''}{priceDifference.toFixed(1)}%
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">So với báo giá gốc</p>
                                    </div>

                                    {(negotiation?.activityLog || []).length === 0 ? (
                                        <div className="text-center text-gray-400 py-8">
                                            <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs">Chưa có hoạt động</p>
                                        </div>
                                    ) : (
                                        (negotiation?.activityLog || []).slice().reverse().map((entry) => (
                                            <div key={entry.id} className="flex gap-3 text-sm">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${entry.role === 'contractor' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900">{entry.user}</p>
                                                    <p className="text-gray-600 text-xs">{entry.details}</p>
                                                    <p className="text-gray-400 text-[10px] mt-1">{formatTime(entry.timestamp)}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Gallery Tab */}
                            {sidebarTab === 'gallery' && (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            {(negotiation?.materialGallery || []).map((img) => (
                                                <div
                                                    key={img.id}
                                                    onClick={() => setSelectedImage(img)}
                                                    className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-all group"
                                                >
                                                    <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                        <Maximize2 className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                                        <p className="text-white text-[10px] truncate">{img.caption}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {(negotiation?.materialGallery || []).length === 0 && (
                                            <div className="text-center text-gray-400 py-8">
                                                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                                <p className="text-xs">Chưa có ảnh vật tư</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 border-t border-gray-100 space-y-2">
                                        <input
                                            type="text"
                                            value={galleryCaption}
                                            onChange={(e) => setGalleryCaption(e.target.value)}
                                            placeholder="Mô tả ảnh (VD: Gạch Granite 60x60)"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleUploadImage}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-sm"
                                        >
                                            <Upload className="w-4 h-4" /> Gửi ảnh vật tư
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Image Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-full">
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.caption}
                            className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-2xl">
                            <p className="text-white font-bold text-lg">{selectedImage.caption}</p>
                            <p className="text-white/70 text-sm">Gửi bởi: {selectedImage.uploadedBy} • {formatTime(selectedImage.timestamp)}</p>
                        </div>
                        <button
                            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-all"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
