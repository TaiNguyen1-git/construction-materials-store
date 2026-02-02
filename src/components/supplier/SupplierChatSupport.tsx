'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, ShieldCheck, Phone, Video, Paperclip, Loader2, FileIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onChildAdded, off } from 'firebase/database'

interface Message {
    id: string
    message: string
    isAdmin: boolean
    fileUrl?: string
    fileType?: string
    createdAt: string
}

export default function SupplierChatSupport() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [supplierId, setSupplierId] = useState<string | null>(null)
    const [supplierName, setSupplierName] = useState('Supplier')

    useEffect(() => {
        const storedId = localStorage.getItem('supplier_id')
        const storedName = localStorage.getItem('supplier_name') || 'Đối tác'
        setSupplierId(storedId)
        setSupplierName(storedName)

        if (storedId) {
            fetchMessages(storedId)
        }
    }, [])

    // Firebase real-time listener for new messages
    useEffect(() => {
        if (!conversationId) return

        const db = getFirebaseDatabase()
        const messagesRef = ref(db, `conversations/${conversationId}/messages`)

        onChildAdded(messagesRef, (snapshot) => {
            const newMsg = snapshot.val()
            if (newMsg) {
                const formattedMsg: Message = {
                    id: newMsg.id,
                    message: newMsg.content || '',
                    isAdmin: newMsg.senderId !== supplierId,
                    fileUrl: newMsg.fileUrl,
                    fileType: newMsg.fileType,
                    createdAt: newMsg.createdAt
                }

                setMessages(prev => {
                    // Prevent duplicates
                    if (prev.some(m => m.id === formattedMsg.id)) {
                        return prev
                    }
                    return [...prev, formattedMsg]
                })
            }
        })

        return () => {
            off(messagesRef)
        }
    }, [conversationId, supplierId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    const fetchMessages = async (id: string) => {
        try {
            const res = await fetch(`/api/supplier/chat?supplierId=${id}`)
            const data = await res.json()
            if (data.success && data.data) {
                setMessages(data.data.messages || [])
                if (data.data.conversationId) {
                    setConversationId(data.data.conversationId)
                }
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        }
    }

    const handleSend = async (fileUrl?: string, fileType?: string) => {
        if ((!newMessage.trim() && !fileUrl) || !supplierId) return

        const msg = newMessage
        if (!fileUrl) setNewMessage('')

        // Optimistic update
        const tempId = Date.now().toString()
        const tempMsg: Message = {
            id: tempId,
            message: msg || (fileUrl ? 'Đã gửi tệp đính kèm' : ''),
            isAdmin: false,
            fileUrl,
            fileType,
            createdAt: new Date().toISOString()
        }

        setMessages(prev => [...prev, tempMsg])

        try {
            const res = await fetch('/api/supplier/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId,
                    message: msg,
                    fileUrl,
                    fileType
                })
            })
            const data = await res.json()
            if (data.success && data.data) {
                // Replace temp message with real one
                setMessages(prev => prev.map(m =>
                    m.id === tempId ? { ...m, id: data.data.id } : m
                ))

                // Set conversationId if not set
                if (!conversationId && data.data.conversationId) {
                    setConversationId(data.data.conversationId)
                }
            }
        } catch (error) {
            console.error('Failed to send:', error)
            // Remove failed message
            setMessages(prev => prev.filter(m => m.id !== tempId))
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()

            if (data.success) {
                await handleSend(data.fileUrl, file.type)
            }
        } catch (error) {
            console.error('Upload failed', error)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleCall = (type: 'audio' | 'video') => {
        if (typeof (window as any).__startCall === 'function' && supplierId) {
            (window as any).__startCall('admin_support', 'Tổng đài hỗ trợ', conversationId || 'support_conv', type)
        } else {
            alert('Hệ thống gọi chưa sẵn sàng. Vui lòng tải lại trang.')
        }
    }

    if (!supplierId) return null

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-96 h-[550px] bg-white rounded-3xl shadow-2xl border border-slate-200 z-[100] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-slate-900 p-4 flex items-center justify-between text-white shadow-md z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/50">
                                    <ShieldCheck className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Hỗ trợ đối tác</h3>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Trực tuyến
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleCall('audio')} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors" title="Gọi điện">
                                    <Phone className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleCall('video')} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors" title="Video call">
                                    <Video className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                            {messages.length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-sm">
                                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>Xin chào! Chúng tôi có thể giúp gì cho bạn?</p>
                                </div>
                            )}
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.isAdmin
                                        ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none'
                                        }`}>
                                        {msg.fileUrl ? (
                                            <div className="mb-1">
                                                {msg.fileType?.startsWith('image/') ? (
                                                    <img src={msg.fileUrl} alt="attachment" className="rounded-lg max-w-full max-h-48 object-cover border border-white/20" />
                                                ) : (
                                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-colors">
                                                        <FileIcon className="w-4 h-4" />
                                                        <span className="underline decoration-dotted text-xs truncate max-w-[150px]">Tải tệp đính kèm</span>
                                                    </a>
                                                )}
                                            </div>
                                        ) : null}
                                        {msg.message?.startsWith('[CALL_LOG]:') ? (() => {
                                            try {
                                                const log = JSON.parse(msg.message.replace('[CALL_LOG]:', ''))
                                                const mins = Math.floor(log.duration / 60)
                                                const secs = log.duration % 60
                                                const durationStr = mins > 0 ? `${mins}ph ${secs}s` : `${secs}s`
                                                const isVideo = log.type === 'video'
                                                return (
                                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-2 rounded-full ${msg.isAdmin ? 'bg-slate-100' : 'bg-white/20'}`}>
                                                                {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-[12px]">{isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}</p>
                                                                <p className="text-[10px] opacity-70">{durationStr}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleCall(isVideo ? 'video' : 'audio')}
                                                            className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${msg.isAdmin ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'
                                                                }`}
                                                        >
                                                            Gọi lại
                                                        </button>
                                                    </div>
                                                )
                                            } catch (e) {
                                                return <p>{msg.message}</p>
                                            }
                                        })() : msg.message && <p>{msg.message}</p>}
                                        <span className="text-[10px] opacity-70 mt-1 block text-right">
                                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-slate-100">
                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <div className="flex-1 relative">
                                    <textarea
                                        rows={1}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Nhập tin nhắn..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none max-h-24 custom-scrollbar"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleSend()
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() && !isUploading}
                                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:brightness-110 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center z-[90] transition-all"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                )}
            </motion.button>
        </>
    )
}
