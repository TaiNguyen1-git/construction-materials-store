'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X, Maximize2, Minimize2, Loader2 } from 'lucide-react'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onValue, set, remove, onDisconnect } from 'firebase/database'
import toast from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'

// PeerJS is client-only - Import types separately
import type PeerType from 'peerjs'
import type { MediaConnection } from 'peerjs'

// PeerJS will be loaded dynamically inside useEffect
interface CustomWindow extends Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
    __startCall?: (otherUserId: string, otherUserName: string, conversationId: string, type?: 'audio' | 'video') => Promise<void>;
}

declare const window: CustomWindow;

interface CallData {
    callerId: string
    callerName: string
    recipientId: string
    originalRecipientId?: string // For admin_support calls, stores original target for Firebase path
    status: 'ringing' | 'accepted' | 'rejected' | 'ended'
    type: 'audio' | 'video'
    peerId: string
    timestamp: number
    conversationId?: string
}

interface ChatCallManagerProps {
    userId: string
    userName: string
    listenAdminSupport?: boolean // For Admin to also listen for supplier calls
}

export default function ChatCallManager({ userId, userName, listenAdminSupport = false }: ChatCallManagerProps) {
    const [incomingCall, setIncomingCall] = useState<CallData | null>(null)
    const [activeCall, setActiveCall] = useState<CallData | null>(null)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [peer, setPeer] = useState<PeerType | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [isMinimized, setIsMinimized] = useState(false)
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
    const [isUpgrading, setIsUpgrading] = useState(false)

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const currentCallRef = useRef<MediaConnection | null>(null)
    const firebaseStatusUnsubscribeRef = useRef<(() => void) | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const isEndingRef = useRef(false)
    // Refs to hold latest state for long-lived Firebase listeners (avoids stale closures)
    const activeCallRef = useRef<CallData | null>(null)
    const incomingCallRef = useRef<CallData | null>(null)
    // Flag: true while we're doing a video upgrade peer.call(), so global error handler doesn't kill the call
    const isVideoUpgradeRef = useRef(false)

    const audioCtxRef = useRef<AudioContext | null>(null)
    const audioOscillatorRef = useRef<OscillatorNode | null>(null)

    function stopAudio() {
        if (audioOscillatorRef.current) {
            try {
                audioOscillatorRef.current.stop()
                audioOscillatorRef.current.disconnect()
            } catch (e) { }
            audioOscillatorRef.current = null
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
            audioCtxRef.current.suspend().catch(() => { })
        }
    }

    function playAudioStyle(style: 'dial' | 'ring') {
        stopAudio()

        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
            }

            const ctx = audioCtxRef.current
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'sine'

            if (style === 'dial') {
                osc.frequency.setValueAtTime(440, ctx.currentTime)
            } else {
                osc.frequency.setValueAtTime(400, ctx.currentTime)
            }

            gain.gain.setValueAtTime(0.1, ctx.currentTime)

            const interval = style === 'dial' ? 1.5 : 2
            const pulse = style === 'dial' ? 0.8 : 1.2

            const now = ctx.currentTime
            for (let i = 0; i < 30; i++) {
                gain.gain.setValueAtTime(0.1, now + i * interval)
                gain.gain.setValueAtTime(0.1, now + i * interval + pulse)
                gain.gain.setValueAtTime(0, now + i * interval + pulse + 0.1)
            }

            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start()
            audioOscillatorRef.current = osc
        } catch (e) {
            // Silently fail for audio
        }
    }

    function playRingtone() {
        playAudioStyle('ring')
    }



    async function acceptCall() {
        if (!incomingCall) return

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error('Trình duyệt không hỗ trợ truy cập Micro/Camera qua kết nối không bảo mật.')
                rejectCall()
                return
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: incomingCall.type === 'video'
            })
            setLocalStream(stream)
            // srcObject handled by useEffect

            stopAudio()

            const db = getFirebaseDatabase()
            const updatedCall: CallData = { ...incomingCall, status: 'accepted' }

            // Update status in Firebase - use original path for admin_support calls
            const firebasePath = incomingCall.originalRecipientId || userId
            await set(ref(db, `calls/${firebasePath}`), updatedCall)

            setIncomingCall(null)
            setActiveCall(updatedCall)

            // If the PeerJS call arrived BEFORE we accepted, answer it now
            const currentCall = currentCallRef.current
            if (currentCall && 'answer' in currentCall && !((currentCall as any).answerUsed)) {
                currentCall.answer(stream)
                currentCall.on('stream', (rStream: MediaStream) => {
                    setRemoteStream(rStream)
                })
                ;(currentCall as any).answerUsed = true
            }
        } catch (err) {
            rejectCall()
        }
    }

    async function rejectCall() {
        if (!incomingCall) return
        const db = getFirebaseDatabase()
        // Use original path for admin_support calls
        const firebasePath = incomingCall.originalRecipientId || userId
        await set(ref(db, `calls/${firebasePath}`), { ...incomingCall, status: 'rejected' })
        setTimeout(() => remove(ref(db, `calls/${firebasePath}`)), 1000)
        stopAudio()
        setIncomingCall(null)
    }

    async function endCall() {
        if (isEndingRef.current) return
        isEndingRef.current = true

        const db = getFirebaseDatabase()
        const targetId = activeCall?.recipientId === userId ? activeCall?.callerId : activeCall?.recipientId

        // Save data for log before cleanup
        const finalDuration = callDuration
        const callType = activeCall?.type
        const convId = activeCall?.conversationId
        const callStatus = activeCall?.status

        // 1. IMMEDIATE UI CLEANUP
        stopAudio()
        cleanupStreams()
        setActiveCall(null)
        setIncomingCall(null)
        toast('Cuộc gọi đã kết thúc')

        // 2. BACKGROUND TASKS
        try {
            if (targetId) {
                set(ref(db, `calls/${targetId}`), { status: 'ended' })
                setTimeout(() => remove(ref(db, `calls/${targetId}`)), 1000)
            }

            if (activeCall?.recipientId === userId) {
                remove(ref(db, `calls/${userId}`))
            }

            // Send Call Log to Chat if call was accepted
            if (convId && callStatus === 'accepted' && finalDuration > 0) {
                fetchWithAuth('/api/chat/messages', {
                    method: 'POST',
                    body: JSON.stringify({
                        conversationId: convId,
                        content: `[CALL_LOG]:{"type":"${callType}","duration":${finalDuration}}`,
                        senderName: userName
                    })
                }).catch(() => {})
            }
        } catch (err) {
            // Silent cleanup
        } finally {
            // Reset ending flag after a delay to prevent bridge overlaps
            setTimeout(() => { isEndingRef.current = false }, 2000)
        }
    }

    function handleCallAcceptedByPartner(data: CallData) {
        stopAudio()
        setActiveCall(data)
        if (peer && localStream) {
            const call = peer.call(data.recipientId, localStream)
            call.on('stream', (rStream: MediaStream) => {
                setRemoteStream(rStream)
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream
            })
            currentCallRef.current = call
        }
    }

    function handleCallEndedByPartner() {
        cleanupStreams()
        stopAudio()
        setActiveCall(null)
        setIncomingCall(null)
        toast('Cuộc gọi đã kết thúc')
    }

    function cleanupStreams() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop())
            setLocalStream(null)
        }
        setRemoteStream(null)

        if (localVideoRef.current) localVideoRef.current.srcObject = null
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null

        if (currentCallRef.current) {
            currentCallRef.current.close()
            currentCallRef.current = null
        }

        if (firebaseStatusUnsubscribeRef.current) {
            firebaseStatusUnsubscribeRef.current()
            firebaseStatusUnsubscribeRef.current = null
        }
    }

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setIsMuted(!audioTrack.enabled)
            }
        }
    }

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                setIsVideoOff(!videoTrack.enabled)
            } else {
                upgradeToVideo()
            }
        }
    }

    const upgradeToVideo = async () => {
        if (!activeCall || !localStream || isUpgrading) return
        setIsUpgrading(true)

        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            toast.error('Video Call yêu cầu kết nối HTTPS bảo mật.')
            setIsUpgrading(false)
            return
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error('Trình duyệt của bạn không hỗ trợ truy cập Camera.')
            setIsUpgrading(false)
            return
        }

        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            })
            const videoTrack = videoStream.getVideoTracks()[0]

            if (!videoTrack) {
                toast.error('Không tìm thấy camera.')
                setIsUpgrading(false)
                return
            }

            // --- PROPER WebRTC approach: add track to EXISTING RTCPeerConnection ---
            const peerConn: RTCPeerConnection | null = currentCallRef.current?.peerConnection ?? null

            if (peerConn && peerConn.signalingState !== 'closed') {
                // Try to replace existing video sender first (renegotiation-free)
                const videoSenders = peerConn.getSenders().filter(s => s.track?.kind === 'video')
                if (videoSenders.length > 0) {
                    await videoSenders[0].replaceTrack(videoTrack)
                } else {
                    peerConn.addTrack(videoTrack, localStream)
                }
            }

            // Update local stream state
            localStream.addTrack(videoTrack)
            const newStream = new MediaStream(localStream.getTracks())
            setLocalStream(newStream)
            localStreamRef.current = newStream
            setIsVideoOff(false)

            // Update Firebase to notify peer of video upgrade
            const db = getFirebaseDatabase()
            const targetId = activeCall.recipientId === userId
                ? activeCall.callerId
                : activeCall.recipientId
            const updatedCall: CallData = { ...activeCall, type: 'video', status: 'accepted' }
            const listenPath = activeCall.recipientId === userId
                ? (activeCall.originalRecipientId || userId)
                : activeCall.recipientId
            await set(ref(db, `calls/${listenPath}`), updatedCall)
            setActiveCall(updatedCall)

            toast.success('Đã bật camera')
            setIsUpgrading(false)

        } catch (err: unknown) {
            const error = err as Error
            if (error.name === 'NotAllowedError') {
                toast.error('Bạn chưa cấp quyền Camera. Vui lòng cho phép trong cài đặt trình duyệt.')
            } else if (error.name === 'NotFoundError') {
                toast.error('Không tìm thấy camera trên thiết bị.')
            } else {
                toast.error('Không thể bật camera.')
            }
            setIsUpgrading(false)
        }
    }

    const handlePeerUpgradedToVideo = async () => {
        if (!activeCall || !localStream) return

        setActiveCall({ ...activeCall, type: 'video' })
        toast('Đối phương đã bật camera')

        // Ask for camera permission locally to send our video back
        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
            const videoTrack = videoStream.getVideoTracks()[0]
            if (videoTrack) {
                localStream.addTrack(videoTrack)
                setLocalStream(new MediaStream(localStream.getTracks()))
                setIsVideoOff(false)
            }
        } catch (e) {
            // Recipient declined camera on upgrade
        }
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const startCall = useCallback(async (otherUserId: string, otherUserName: string, conversationId: string, type: 'audio' | 'video' = 'audio') => {
        try {
            const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

            if (!hasMedia) {
                const reason = !window.isSecureContext
                    ? 'Bạn đang truy cập qua kết nối không bảo mật (HTTP). Vui lòng dùng localhost hoặc HTTPS.'
                    : 'Trình duyệt của bạn không hỗ trợ hoặc đã bị chặn quyền truy cập Media.'
                toast.error(reason)
                return
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video'
            })
            setLocalStream(stream)
            localStreamRef.current = stream

            if (type === 'audio') playAudioStyle('dial')

            const callData: CallData = {
                callerId: userId,
                callerName: userName,
                recipientId: otherUserId,
                status: 'ringing',
                type: type,
                peerId: userId,
                timestamp: Date.now(),
                conversationId: conversationId
            }

            const db = getFirebaseDatabase()
            const targetCallRef = ref(db, `calls/${otherUserId}`)
            await set(targetCallRef, callData)
            setActiveCall(callData)

            // Trigger Web Push Notification to the recipient
            fetch('/api/chat/calls/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: otherUserId,
                    callerName: userName,
                    type: type,
                    conversationId: conversationId
                })
            }).catch(() => {})

            // IMPORTANT: Caller listens to the Recipient's path for the 'accepted' status
            const statusUnsubscribe = onValue(targetCallRef, (snapshot) => {
                const data = snapshot.val() as CallData | null
                // Always read from refs - never from stale closure state
                const currentActiveCall = activeCallRef.current
                const currentIncomingCall = incomingCallRef.current

                if (data && data.status === 'accepted' && data.callerId === userId) {
                    // Guard: only accept if we aren't already in an active accepted call
                    if (!currentActiveCall || currentActiveCall.status !== 'accepted') {
                        handleCallAcceptedByPartner(data)
                    }
                    // If already accepted and peer just upgraded to video, handle that
                    else if (data.type === 'video' && currentActiveCall.type === 'audio') {
                        handlePeerUpgradedToVideo()
                    }
                } else if (data && (data.status === 'rejected' || data.status === 'ended')) {
                    handleCallEndedByPartner()
                } else if (!data && (currentActiveCall || currentIncomingCall)) {
                    handleCallEndedByPartner()
                }
            })

            firebaseStatusUnsubscribeRef.current = statusUnsubscribe
            toast.success(`Đang gọi ${otherUserName}...`)
        } catch (err) {
            toast.error('Không thể truy cập micro/camera. Vui lòng kiểm tra cài đặt trình duyệt.')
            cleanupStreams()
        }
    }, [userId, userName, activeCall, incomingCall, playAudioStyle, handleCallAcceptedByPartner, handleCallEndedByPartner, handlePeerUpgradedToVideo])

    // --- REACTIVE EFFECTS (Moved to end to avoid TDZ) ---
    
    // Keep ref in sync for listeners (prevents stale closure bugs)
    useEffect(() => {
        localStreamRef.current = localStream
    }, [localStream])

    useEffect(() => {
        activeCallRef.current = activeCall
    }, [activeCall])

    useEffect(() => {
        incomingCallRef.current = incomingCall
    }, [incomingCall])

    // Reactive audio cleanup
    useEffect(() => {
        if (!activeCall && !incomingCall) {
            stopAudio()
        }
    }, [activeCall, incomingCall])

    // Initialize PeerJS
    useEffect(() => {
        if (!userId) return

        let newPeer: PeerType | null = null
        let isDestroyed = false

        const initPeer = async () => {
            try {
                const PeerJS = (await import('peerjs')).default
                if (isDestroyed) return

                newPeer = new PeerJS(userId, {
                    debug: 1
                })

                newPeer.on('open', () => {
                    // Peer connected
                })

                newPeer.on('call', (call: MediaConnection) => {
                    currentCallRef.current = call

                    if (localStreamRef.current) {
                        call.answer(localStreamRef.current)
                        call.on('stream', (rStream: MediaStream) => {
                            setRemoteStream(rStream)
                        })
                    }
                })

                newPeer.on('error', (err: any) => {
                    const fatalErrors = ['peer-unavailable', 'network', 'disconnected', 'socket-error']
                    if (fatalErrors.includes(err.type)) {
                        // If this error came from a video upgrade attempt, DON'T kill the call
                        if (err.type === 'peer-unavailable' && isVideoUpgradeRef.current) {
                            isVideoUpgradeRef.current = false
                            // Revert video tracks
                            const curStream = localStreamRef.current
                            if (curStream) {
                                curStream.getVideoTracks().forEach(t => { t.stop(); curStream.removeTrack(t) })
                                setLocalStream(new MediaStream(curStream.getTracks()))
                            }
                            setIsVideoOff(true)
                            setIsUpgrading(false)
                            toast.error('Không thể kết nối video. Đang tiếp tục cuộc gọi thoại.')
                            return  // Do NOT end the call
                        }

                        if (err.type === 'peer-unavailable') toast.error('Người dùng không trực tuyến')
                        else if (err.type === 'network') toast.error('Lỗi kết nối mạng')

                        cleanupStreams()
                        setActiveCall(null)
                        setIncomingCall(null)
                        stopAudio()
                    }
                })

                setPeer(newPeer)
            } catch (err) {
                // Peer load failed
            }
        }

        initPeer()

        const db = getFirebaseDatabase()
        const callRef = ref(db, `calls/${userId}`)

        const unsubscribe = onValue(callRef, (snapshot) => {
            const data = snapshot.val() as CallData | null
            // Always read from refs to get latest values (avoids stale closure)
            const curActive = activeCallRef.current
            const curIncoming = incomingCallRef.current

            if (data) {
                if (data.status === 'ringing') {
                    setIncomingCall(data)
                    playRingtone()
                } else if (data.status === 'accepted' && curActive?.callerId === userId) {
                    // Guard: only trigger accept if not already in an accepted call
                    if (!curActive || curActive.status !== 'accepted') {
                        handleCallAcceptedByPartner(data)
                    } else if (data.type === 'video' && curActive.type === 'audio') {
                        // Peer upgraded to video while we were in audio call
                        handlePeerUpgradedToVideo()
                    }
                } else if (data.status === 'accepted' && curActive?.status === 'accepted'
                    && data.type === 'video' && curActive.type === 'audio') {
                    handlePeerUpgradedToVideo()
                } else if (data.status === 'rejected' || data.status === 'ended') {
                    handleCallEndedByPartner()
                }
            } else if (curIncoming || curActive) {
                // Firebase path cleared — call ended by remote side
                handleCallEndedByPartner()
            }
        })
        firebaseStatusUnsubscribeRef.current = unsubscribe
        onDisconnect(callRef).remove()

        let adminSupportUnsubscribe: (() => void) | null = null
        if (listenAdminSupport) {
            const adminSupportRef = ref(db, 'calls/admin_support')
            adminSupportUnsubscribe = onValue(adminSupportRef, (snapshot) => {
                const data = snapshot.val() as CallData | null
                const curActive = activeCallRef.current
                if (!data) {
                    if (curActive?.originalRecipientId === 'admin_support') handleCallEndedByPartner()
                    return
                }
                if (data.status === 'ringing') {
                    setIncomingCall({ ...data, originalRecipientId: 'admin_support', recipientId: userId })
                    playRingtone()
                } else if (curActive?.originalRecipientId === 'admin_support') {
                    if (data.status === 'rejected' || data.status === 'ended') handleCallEndedByPartner()
                    else if (data.type === 'video' && curActive.type === 'audio') handlePeerUpgradedToVideo()
                }
            })
            onDisconnect(adminSupportRef).remove()
        }

        return () => {
            isDestroyed = true
            unsubscribe()
            if (adminSupportUnsubscribe) adminSupportUnsubscribe()
            if (newPeer) newPeer.destroy()
        }
    }, [userId, listenAdminSupport])

    // Network & Timer
    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); toast.success('Đã khôi phục kết nối mạng') }
        const handleOffline = () => { setIsOnline(false); toast.error('Mất kết nối mạng'); if (activeCall) endCall() }
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline) }
    }, [activeCall])

    useEffect(() => {
        if (activeCall && activeCall.status === 'accepted') {
            timerRef.current = setInterval(() => { setCallDuration(prev => prev + 1) }, 1000)
        } else {
            if (timerRef.current) clearInterval(timerRef.current)
            setCallDuration(0)
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [activeCall])

    // Video Sync
    useEffect(() => {
        if (localStream && localVideoRef.current) localVideoRef.current.srcObject = localStream
    }, [localStream, activeCall, isMinimized])

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
    }, [remoteStream, activeCall, isMinimized])

    useEffect(() => {
        return () => {
            stopAudio()
            if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => { }); audioCtxRef.current = null }
        }
    }, [])

    // Export internal functions safely if needed via window (for demo)
    useEffect(() => {
        window.__startCall = startCall
        return () => { delete window.__startCall }
    }, [peer, localStream, startCall])

    if (!incomingCall && !activeCall && isOnline) return null

    if (!isOnline && !incomingCall && !activeCall) {
        return (
            <div className="fixed bottom-4 left-4 z-[9999] bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">Mất kết nối Internet</span>
            </div>
        )
    }

    return (
        <div className={`fixed z-[9999] transition-all duration-500 ease-in-out ${isMinimized ? 'bottom-8 right-8 w-72' : 'inset-0 bg-black/80 flex items-center justify-center p-4'}`}>
            {!isOnline && (
                <div className="absolute top-0 left-0 right-0 bg-rose-600 text-white text-[10px] font-black uppercase py-2 text-center tracking-[0.3em] animate-pulse">
                    Đang thử kết nối lại mạng...
                </div>
            )}
            {incomingCall && !activeCall && (
                <div className="bg-white/90 backdrop-blur-xl rounded-[40px] p-8 max-w-sm w-full shadow-2xl border border-white/20 animate-in zoom-in duration-300">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-200">
                                {incomingCall.callerName.charAt(0)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-1">{incomingCall.callerName}</h3>
                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-pulse">Cuộc gọi đến...</p>

                        <div className="flex gap-4 w-full">
                            <button
                                onClick={rejectCall}
                                title="Từ chối"
                                className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl py-4 flex items-center justify-center transition-all border border-rose-100"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </button>
                            <button
                                onClick={acceptCall}
                                title="Chấp nhận"
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 flex items-center justify-center transition-all shadow-xl shadow-emerald-200"
                            >
                                <Phone className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeCall && (
                <div className={`transition-all duration-500 ease-in-out overflow-hidden shadow-2xl ${isMinimized
                    ? 'bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-3 w-full'
                    : 'bg-gray-900 rounded-[40px] w-full max-w-4xl h-[80vh] flex flex-col'
                    }`}>
                    {isMinimized ? (
                        /* Sleek Minimized UI */
                        <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                                    {(activeCall.callerId === userId ? (activeCall.recipientId === 'admin_support' ? 'S' : activeCall.recipientId.charAt(0)) : activeCall.callerName.charAt(0))}
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-black text-[11px] truncate uppercase tracking-wider">
                                    {activeCall.callerId === userId ? 'Đang kết nối...' : activeCall.callerName}
                                </h4>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                    <p className="text-gray-400 text-[10px] font-mono tracking-widest">{formatDuration(callDuration)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleMute}
                                    className={`p-2 rounded-xl transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setIsMinimized(false)}
                                    className="p-2 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={endCall}
                                    className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all"
                                >
                                    <PhoneOff className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Expanded Full UI */
                        <>
                            <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                                        {(activeCall.callerId === userId ? (activeCall.recipientId === 'admin_support' ? 'S' : activeCall.recipientId.charAt(0)) : activeCall.callerName.charAt(0))}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black text-lg">
                                            {activeCall.callerId === userId ? 'Đang thực hiện cuộc gọi' : activeCall.callerName}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                            <p className="text-gray-400 text-xs font-mono tracking-widest uppercase">{formatDuration(callDuration)}</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsMinimized(true)} className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                                    <Minimize2 className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                                {activeCall.type === 'video' ? (
                                    <>
                                        <video
                                            ref={remoteVideoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover opacity-90"
                                        />
                                        <div className="absolute top-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                                            Trực tiếp
                                        </div>
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="absolute bottom-6 right-6 w-48 md:w-64 aspect-video object-cover rounded-[24px] border-2 border-white/20 shadow-2xl z-20"
                                        />
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                                        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-purple-600/10" />
                                        <div className="relative">
                                            <div className="w-40 h-40 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[48px] flex items-center justify-center text-white text-7xl font-black mb-12 shadow-2xl relative z-10">
                                                {(activeCall.callerId === userId ? (activeCall.recipientId === 'admin_support' ? 'S' : 'C') : activeCall.callerName.charAt(0))}
                                            </div>
                                            <div className="absolute -inset-4 bg-blue-500/20 rounded-[56px] animate-ping duration-1000" />
                                        </div>
                                        <div className="flex gap-1.5 h-12 items-center relative z-10">
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                                <div key={i} className="w-1.5 bg-blue-400/50 rounded-full animate-audio-bar" style={{ height: '20px', animationDelay: `${i * 0.1}s` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeCall.status === 'ringing' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-30">
                                        <div className="text-center">
                                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                                            <p className="text-white font-black text-xl tracking-[0.2em] uppercase">Đang kết nối...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-10 bg-white/5 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-8">
                                <button
                                    onClick={toggleMute}
                                    className={`p-5 rounded-[24px] transition-all ${isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-200/20' : 'bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10'}`}
                                >
                                    {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                                </button>

                                <button
                                    onClick={endCall}
                                    className="p-7 bg-rose-600 hover:bg-rose-700 text-white rounded-[32px] transition-all shadow-2xl shadow-rose-900/40 hover:scale-110 active:scale-90"
                                >
                                    <PhoneOff className="w-10 h-10" />
                                </button>

                                {activeCall.type === 'video' ? (
                                    <button
                                        onClick={toggleVideo}
                                        disabled={isUpgrading}
                                        className={`p-5 rounded-[24px] transition-all ${isVideoOff ? 'bg-rose-500 text-white shadow-lg shadow-rose-200/20' : 'bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10'}`}
                                    >
                                        {isUpgrading ? <Loader2 className="w-7 h-7 animate-spin" /> : (isVideoOff ? <VideoOff className="w-7 h-7" /> : <Video className="w-7 h-7" />)}
                                    </button>
                                ) : (
                                    <button
                                        onClick={upgradeToVideo}
                                        disabled={isUpgrading}
                                        className={`p-5 rounded-[24px] bg-white/5 text-gray-200 hover:bg-white/10 border border-white/10 transition-all ${isUpgrading ? 'animate-pulse' : ''}`}
                                        title="Bật camera"
                                    >
                                        {isUpgrading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Video className="w-7 h-7" />}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes audio-bar {
                    0%, 100% { height: 12px; opacity: 0.3; }
                    50% { height: 40px; opacity: 1; }
                }
                .animate-audio-bar {
                    animation: audio-bar 0.8s infinite ease-in-out;
                }
                .inset-0 {
                    top: 0; right: 0; bottom: 0; left: 0;
                }
            `}</style>
        </div>
    )
}
