'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X, Maximize2, Minimize2 } from 'lucide-react'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onValue, set, remove, onDisconnect } from 'firebase/database'
import Peer, { type MediaConnection } from 'peerjs'
import toast from 'react-hot-toast'

interface CallData {
    callerId: string
    callerName: string
    recipientId: string
    status: 'ringing' | 'accepted' | 'rejected' | 'ended'
    type: 'audio' | 'video'
    peerId: string
    timestamp: number
    conversationId?: string
}

interface ChatCallManagerProps {
    userId: string
    userName: string
}

export default function ChatCallManager({ userId, userName }: ChatCallManagerProps) {
    const [incomingCall, setIncomingCall] = useState<CallData | null>(null)
    const [activeCall, setActiveCall] = useState<CallData | null>(null)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [peer, setPeer] = useState<Peer | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [isMinimized, setIsMinimized] = useState(false)

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const currentCallRef = useRef<MediaConnection | { statusUnsubscribe: () => void } | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)

    // Keep ref in sync for listeners
    useEffect(() => {
        localStreamRef.current = localStream
    }, [localStream])

    // Initialize PeerJS
    useEffect(() => {
        if (!userId) return

        const newPeer = new Peer(userId, {
            debug: 1
        })

        newPeer.on('open', (id) => {
            console.log('PeerJS opened with ID:', id)
        })

        newPeer.on('call', (call) => {
            console.log('Incoming PeerJS call from:', call.peer)
            currentCallRef.current = call

            // If we already accepted via Firebase, answer immediately
            // Otherwise, we'll answer when acceptCall is called (via a ref)
            if (localStreamRef.current) {
                console.log('Answering incoming call with existing localStream')
                call.answer(localStreamRef.current)
                call.on('stream', (rStream) => {
                    setRemoteStream(rStream)
                })
            }
        })

        newPeer.on('error', (err) => {
            console.error('PeerJS error:', err)
            if (err.type === 'peer-unavailable') {
                toast.error('Người dùng không trực tuyến')
                endCall()
            }
        })

        setPeer(newPeer)

        // Listen for Firebase signaling
        const db = getFirebaseDatabase()
        const callRef = ref(db, `calls/${userId}`)

        const unsubscribe = onValue(callRef, (snapshot) => {
            const data = snapshot.val() as CallData | null

            if (data) {
                if (data.status === 'ringing') {
                    setIncomingCall(data)
                    playRingtone()
                } else if (data.status === 'accepted' && activeCall?.callerId === userId) {
                    // Recipient accepted our call
                    handleCallAcceptedByPartner(data)
                } else if (data.status === 'rejected' || data.status === 'ended') {
                    handleCallEndedByPartner()
                }
            } else {
                // If data is removed, call ended
                if (incomingCall || activeCall) {
                    handleCallEndedByPartner()
                }
            }
        })

        // Clean up on disconnect
        onDisconnect(callRef).remove()

        return () => {
            unsubscribe()
            newPeer.destroy()
        }
    }, [userId])

    // Timer logic
    useEffect(() => {
        if (activeCall && activeCall.status === 'accepted') {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1)
            }, 1000)
        } else {
            if (timerRef.current) clearInterval(timerRef.current)
            setCallDuration(0)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [activeCall])

    // Sync Streams to Video Elements
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream
        }
    }, [localStream, activeCall, isMinimized])

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
        }
    }, [remoteStream, activeCall, isMinimized])

    const audioCtxRef = useRef<AudioContext | null>(null)
    const audioOscillatorRef = useRef<OscillatorNode | null>(null)

    const stopAudio = () => {
        if (audioOscillatorRef.current) {
            try {
                audioOscillatorRef.current.stop()
            } catch (e) { }
            audioOscillatorRef.current = null
        }
    }

    const playAudioStyle = (style: 'dial' | 'ring') => {
        stopAudio()

        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).AudioContext)()
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
            console.error('Failed to play audio:', e)
        }
    }

    const playRingtone = () => {
        playAudioStyle('ring')
    }

    const startCall = async (otherUserId: string, otherUserName: string, conversationId: string, type: 'audio' | 'video' = 'audio') => {
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
            // srcObject will be handled by useEffect

            playAudioStyle('dial')

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

            // IMPORTANT: Caller listens to the Recipient's path for the 'accepted' status
            const statusUnsubscribe = onValue(targetCallRef, (snapshot) => {
                const data = snapshot.val() as CallData | null
                if (data && data.status === 'accepted' && data.callerId === userId) {
                    handleCallAcceptedByPartner(data)
                    // We can stop listening once connected
                } else if (data && (data.status === 'rejected' || data.status === 'ended')) {
                    handleCallEndedByPartner()
                }
            })

            // Store unsubscribe to cleanup later
            currentCallRef.current = { statusUnsubscribe }

            toast.success(`Đang gọi ${otherUserName}...`)
        } catch (err) {
            console.error('Failed to get media stream:', err)
            toast.error('Không thể truy cập micro/camera')
        }
    }

    const acceptCall = async () => {
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

            // Update status in Firebase for BOTH paths if needed, 
            // but usually we just update the recipient's path which the caller listens to
            await set(ref(db, `calls/${userId}`), updatedCall)

            setIncomingCall(null)
            setActiveCall(updatedCall)

            // If the PeerJS call arrived BEFORE we accepted, answer it now
            const currentCall = currentCallRef.current
            if (currentCall && 'answer' in currentCall && !('answerUsed' in currentCall && (currentCall as any).answerUsed)) {
                console.log('Answering delayed PeerJS call')
                currentCall.answer(stream)
                currentCall.on('stream', (rStream: MediaStream) => {
                    setRemoteStream(rStream)
                })
                    ; (currentCall as any).answerUsed = true
            }
        } catch (err) {
            console.error('Failed to accept call:', err)
            rejectCall()
        }
    }

    const rejectCall = async () => {
        if (!incomingCall) return
        const db = getFirebaseDatabase()
        await set(ref(db, `calls/${userId}`), { ...incomingCall, status: 'rejected' })
        setTimeout(() => remove(ref(db, `calls/${userId}`)), 1000)
        stopAudio()
        setIncomingCall(null)
    }

    const endCall = async () => {
        const db = getFirebaseDatabase()
        const targetId = activeCall?.recipientId === userId ? activeCall?.callerId : activeCall?.recipientId

        // Save duration before cleaning up
        const finalDuration = callDuration
        const callType = activeCall?.type
        const convId = activeCall?.conversationId

        if (targetId) {
            await set(ref(db, `calls/${targetId}`), { ...activeCall, status: 'ended' })
            setTimeout(() => remove(ref(db, `calls/${targetId}`)), 1000)
        }

        if (activeCall?.recipientId === userId) {
            await remove(ref(db, `calls/${userId}`))
        }

        // Send Call Log to Chat if call was accepted
        if (convId && activeCall?.status === 'accepted' && finalDuration > 0) {
            try {
                const headers = {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
                await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        conversationId: convId,
                        content: `[CALL_LOG]:{"type":"${callType}","duration":${finalDuration}}`
                    })
                })
            } catch (err) {
                console.error('Failed to send call log:', err)
            }
        }

        cleanupStreams()
        stopAudio()
        setActiveCall(null)
        setIncomingCall(null)
    }

    const handleCallAcceptedByPartner = (data: CallData) => {
        stopAudio()
        setActiveCall(data)
        if (peer && localStream) {
            const call = peer.call(data.recipientId, localStream)
            call.on('stream', (rStream) => {
                setRemoteStream(rStream)
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream
            })
            currentCallRef.current = call
        }
    }

    const handleCallEndedByPartner = () => {
        cleanupStreams()
        stopAudio()
        setActiveCall(null)
        setIncomingCall(null)
        toast('Cuộc gọi đã kết thúc')
    }

    const cleanupStreams = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop())
            setLocalStream(null)
        }
        setRemoteStream(null)

        if (localVideoRef.current) localVideoRef.current.srcObject = null
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null

        const currentCall = currentCallRef.current
        if (currentCall) {
            if ('close' in currentCall) currentCall.close()
            if ('statusUnsubscribe' in currentCall) currentCall.statusUnsubscribe()
            currentCallRef.current = null
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
            }
        }
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Export internal functions safely if needed via window (for demo)
    useEffect(() => {
        (window as any).__startCall = startCall
        return () => { delete (window as any).__startCall }
    }, [peer, localStream, startCall])

    if (!incomingCall && !activeCall) return null

    return (
        <div className={`fixed z-[9999] transition-all duration-500 ${isMinimized ? 'bottom-4 right-4 w-64 h-20' : 'inset-0 bg-black/80 flex items-center justify-center p-4'}`}>
            {incomingCall && !activeCall && (
                <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-bounce-subtle">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-black mb-6 shadow-xl shadow-indigo-200">
                            {incomingCall.callerName.charAt(0)}
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">{incomingCall.callerName}</h3>
                        <p className="text-gray-500 font-bold mb-8 animate-pulse italic">Đang gọi cho bạn...</p>

                        <div className="flex gap-4 w-full">
                            <button
                                onClick={rejectCall}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl py-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-100"
                            >
                                <PhoneOff className="w-6 h-6" />
                                <span className="font-black uppercase text-sm">Từ chối</span>
                            </button>
                            <button
                                onClick={acceptCall}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-2xl py-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-100"
                            >
                                <Phone className="w-6 h-6" />
                                <span className="font-black uppercase text-sm">Nghe</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeCall && (
                <div className={`bg-gray-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${isMinimized ? 'w-full h-full' : 'max-w-4xl w-full h-[80vh]'}`}>
                    {/* Call Header */}
                    <div className="p-4 bg-gray-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                                {(activeCall.callerId === userId ? activeCall.recipientId.charAt(0) : activeCall.callerId.charAt(0))}
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">
                                    {activeCall.callerId === userId ? 'Đang gọi...' : activeCall.callerName}
                                </h4>
                                <p className="text-gray-400 text-[10px] font-mono">{formatDuration(callDuration)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isMinimized && (
                                <>
                                    <button
                                        onClick={toggleMute}
                                        className={`p-2 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                    >
                                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={endCall}
                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all"
                                    >
                                        <PhoneOff className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all">
                                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Video Area */}
                    <div className="flex-1 relative bg-black">
                        {activeCall.type === 'video' ? (
                            <>
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="absolute bottom-4 right-4 w-32 md:w-48 aspect-video object-cover rounded-xl border-2 border-white/20 shadow-xl"
                                />
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                                <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center text-white text-5xl font-black mb-6 shadow-2xl animate-pulse">
                                    {(activeCall.callerId === userId ? '?' : activeCall.callerName.charAt(0))}
                                </div>
                                <div className="flex gap-1 h-8 items-end">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="w-1 bg-indigo-400 rounded-full animate-audio-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeCall.status === 'ringing' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                <p className="text-white font-black text-xl animate-pulse">ĐANG CHỜ KẾT NỐI...</p>
                            </div>
                        )}
                    </div>

                    {/* Call Controls */}
                    <div className="p-6 bg-gray-800/80 backdrop-blur-md flex items-center justify-center gap-6">
                        <button
                            onClick={toggleMute}
                            className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                        >
                            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>

                        <button
                            onClick={endCall}
                            className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-xl shadow-red-900/40 hover:scale-110 active:scale-90"
                        >
                            <PhoneOff className="w-8 h-8" />
                        </button>

                        {activeCall.type === 'video' && (
                            <button
                                onClick={toggleVideo}
                                className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                            >
                                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
                @keyframes audio-bar {
                    0%, 100% { height: 10px; }
                    50% { height: 32px; }
                }
                .animate-audio-bar {
                    animation: audio-bar 0.8s infinite ease-in-out;
                }
            `}</style>
        </div>
    )
}
