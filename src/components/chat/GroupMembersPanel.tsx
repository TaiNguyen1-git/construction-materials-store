'use client'

import { useState, useEffect } from 'react'
import { User, Phone, Mail, Clock, Shield, Users, MessageSquare, Loader2, AlertCircle, X, Image as ImageIcon, FileText, Link2 } from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-client'
import { getFirebaseDatabase } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'

interface GroupMembersPanelProps {
    conversation: {
        id: string
        groupTitle?: string | null
        participantIds?: string[]
        participantNames?: string[]
    }
    onClose?: () => void
    onStartDirectChat?: (userId: string, userName: string) => void
}

interface MemberDetail {
    id: string
    name: string
    email?: string
    phone?: string
    role?: string
    createdAt?: string
}

export default function GroupMembersPanel({
    conversation,
    onClose,
    onStartDirectChat
}: GroupMembersPanelProps) {
    const [members, setMembers] = useState<MemberDetail[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'members' | 'media'>('members')
    const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null)
    
    // Storage states
    const [sharedMedia, setSharedMedia] = useState<{ id: string, url: string, type: string, name: string, date: string }[]>([])
    const [sharedFiles, setSharedFiles] = useState<{ id: string, url: string, name: string, isLink?: boolean, date: string }[]>([])
    const [mediaTab, setMediaTab] = useState<'media' | 'files'>('media')

    useEffect(() => {
        if (conversation?.participantIds) {
            fetchMembersDetails()
        }
    }, [conversation])

    // Fetch message history for Media & Files
    useEffect(() => {
        if (!conversation?.id) return

        const db = getFirebaseDatabase()
        const messagesRef = ref(db, `conversations/${conversation.id}/messages`)

        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const val = snapshot.val()
            if (!val) {
                setSharedMedia([])
                setSharedFiles([])
                return
            }

            const mediaList: any[] = []
            const fileList: any[] = []

            Object.entries(val).forEach(([key, msg]: [string, any]) => {
                if (msg.fileUrl) {
                    const fileType = msg.fileType || ''
                    const isImgOrVid = fileType.startsWith('image/') || fileType.startsWith('video/')
                    if (isImgOrVid) {
                        mediaList.push({
                            id: key,
                            url: msg.fileUrl,
                            type: fileType,
                            name: msg.fileName || 'Ảnh/Video',
                            date: msg.createdAt || new Date().toISOString()
                        })
                    } else {
                        fileList.push({
                            id: key,
                            url: msg.fileUrl,
                            name: msg.fileName || 'Tài liệu',
                            date: msg.createdAt || new Date().toISOString()
                        })
                    }
                } else if (msg.content && (msg.content.includes('http://') || msg.content.includes('https://'))) {
                    const urlRegex = /(https?:\/\/[^\s]+)/g
                    const urls = msg.content.match(urlRegex)
                    if (urls) {
                        urls.forEach((url: string) => {
                            fileList.push({
                                id: key + '-' + url,
                                url: url,
                                name: url,
                                isLink: true,
                                date: msg.createdAt || new Date().toISOString()
                            })
                        })
                    }
                }
            })

            mediaList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            fileList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

            setSharedMedia(mediaList)
            setSharedFiles(fileList)
        })

        return () => {
            unsubscribe()
        }
    }, [conversation?.id])

    const fetchMembersDetails = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const ids = conversation.participantIds || []
            const details = await Promise.all(
                ids.map(async (id) => {
                    try {
                        const res = await fetch(`/api/users/${id}/contact`, {
                            headers: getAuthHeaders()
                        })
                        if (res.ok) {
                            const data = await res.json()
                            return data.data
                        }
                    } catch (e) {
                        console.error(`Failed to fetch info for member ${id}`, e)
                    }
                    const idx = ids.indexOf(id)
                    const name = conversation.participantNames?.[idx] || 'Thành viên'
                    return {
                        id,
                        name,
                        role: id.startsWith('guest_') ? 'GUEST' : 'USER'
                    }
                })
            )
            
            setMembers(details.filter(Boolean))
        } catch (err) {
            setError('Lỗi khi tải danh sách thành viên')
        } finally {
            setLoading(false)
        }
    }

    const getRoleBadge = (role?: string) => {
        const roles: Record<string, { bg: string, text: string, label: string }> = {
            'MANAGER': { bg: 'bg-rose-50 border border-rose-100', text: 'text-rose-600', label: 'Quản trị viên' },
            'ADMIN': { bg: 'bg-rose-50 border border-rose-100', text: 'text-rose-600', label: 'Quản trị viên' },
            'EMPLOYEE': { bg: 'bg-indigo-50 border border-indigo-100', text: 'text-indigo-600', label: 'Nhân viên' },
            'CONTRACTOR': { bg: 'bg-emerald-50 border border-emerald-100', text: 'text-emerald-600', label: 'Nhà thầu' },
            'CUSTOMER': { bg: 'bg-blue-50 border border-blue-100', text: 'text-blue-600', label: 'Khách hàng' },
            'SUPPLIER': { bg: 'bg-amber-50 border border-amber-100', text: 'text-amber-600', label: 'Nhà cung cấp' },
            'GUEST': { bg: 'bg-slate-50 border border-slate-200', text: 'text-slate-500', label: 'Khách vãng lai' },
        }
        return roles[role || ''] || { bg: 'bg-gray-50 border border-gray-100', text: 'text-gray-500', label: 'Thành viên' }
    }

    return (
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full shadow-lg">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Thông tin nhóm
                    </h3>
                </div>
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-50 transition"
                    >
                        Đóng
                    </button>
                )}
            </div>

            {/* Group details title */}
            <div className="p-4 border-b border-gray-100 flex flex-col items-center bg-gray-50/50 flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl flex items-center justify-center font-bold text-2xl shadow-md mb-2">
                    {conversation.groupTitle?.charAt(0).toUpperCase() || 'G'}
                </div>
                <h4 className="font-bold text-gray-900 text-base text-center truncate max-w-full">
                    {conversation.groupTitle || 'Trò chuyện nhóm'}
                </h4>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                    {conversation.participantIds?.length || 0} thành viên
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 flex-shrink-0">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                        activeTab === 'members'
                            ? 'border-blue-600 text-blue-600 bg-blue-50/10'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                >
                    Thành viên
                </button>
                <button
                    onClick={() => setActiveTab('media')}
                    className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                        activeTab === 'media'
                            ? 'border-blue-600 text-blue-600 bg-blue-50/10'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                >
                    Kho lưu trữ
                </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                {activeTab === 'members' ? (
                    <div className="space-y-2">
                        {loading ? (
                            <div className="py-12 flex flex-col items-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                <span className="text-[10px] font-semibold text-gray-400">Đang tải...</span>
                            </div>
                        ) : error ? (
                            <div className="p-4 text-center text-red-500 flex flex-col items-center gap-1">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-xs">{error}</span>
                            </div>
                        ) : (
                            members.map((member) => {
                                const badge = getRoleBadge(member.role)
                                return (
                                    <div 
                                        key={member.id} 
                                        onClick={() => setSelectedMember(member)}
                                        className="p-3 rounded-2xl border border-gray-50 hover:border-gray-100 hover:bg-gray-50/70 transition duration-200 group flex items-center justify-between cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h5 className="font-semibold text-gray-900 text-sm truncate">{member.name}</h5>
                                                <span className={`inline-flex px-1.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider mt-0.5 ${badge.bg} ${badge.text}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        </div>
                                        {onStartDirectChat && member.id !== localStorage.getItem('user_id') && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onStartDirectChat(member.id, member.name)
                                                }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                                                title="Trò chuyện riêng"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col h-full space-y-3">
                        {/* Sub-tabs for Media vs Files */}
                        <div className="flex bg-gray-50 p-0.5 rounded-xl border border-gray-100 text-xs font-semibold">
                            <button
                                onClick={() => setMediaTab('media')}
                                className={`flex-1 py-1.5 rounded-lg transition ${
                                    mediaTab === 'media'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                Ảnh & Video
                            </button>
                            <button
                                onClick={() => setMediaTab('files')}
                                className={`flex-1 py-1.5 rounded-lg transition ${
                                    mediaTab === 'files'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                Tệp & Link
                            </button>
                        </div>

                        {/* Sub-tab content */}
                        <div className="flex-1">
                            {mediaTab === 'media' ? (
                                sharedMedia.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 text-xs flex flex-col items-center gap-2">
                                        <ImageIcon className="w-8 h-8 opacity-30" />
                                        <span>Không có ảnh hoặc video</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {sharedMedia.map((media) => (
                                            <a
                                                key={media.id}
                                                href={media.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="aspect-square bg-slate-100 rounded-xl overflow-hidden relative border border-slate-100 hover:opacity-90 transition group"
                                            >
                                                {media.type.startsWith('video/') ? (
                                                    <video src={media.url} className="w-full h-full object-cover pointer-events-none" />
                                                ) : (
                                                    <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                    <span className="text-[9px] text-white font-bold truncate max-w-full px-1">{media.name}</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )
                            ) : (
                                sharedFiles.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 text-xs flex flex-col items-center gap-2">
                                        <FileText className="w-8 h-8 opacity-30" />
                                        <span>Không có tệp hoặc liên kết</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {sharedFiles.map((file) => (
                                            <a
                                                key={file.id}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2 hover:bg-slate-100 transition min-w-0"
                                            >
                                                {file.isLink ? (
                                                    <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                ) : (
                                                    <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-slate-800 font-bold truncate">{file.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                                                        {file.isLink ? 'Liên kết' : 'Tài liệu'} • {new Date(file.date).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Member Profile Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col items-center">
                        <button 
                            onClick={() => setSelectedMember(null)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mb-4 shadow-xl shadow-blue-100">
                            {selectedMember.name.charAt(0).toUpperCase()}
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">{selectedMember.name}</h4>
                        
                        {(() => {
                            const badge = getRoleBadge(selectedMember.role)
                            return (
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider mt-1 ${badge.bg} ${badge.text}`}>
                                    {badge.label}
                                </span>
                            )
                        })()}

                        <div className="w-full mt-6 space-y-3.5">
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số điện thoại</p>
                                    <p className="text-slate-900 font-bold text-sm mt-0.5">{selectedMember.phone || 'Chưa cập nhật'}</p>
                                </div>
                            </div>

                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email liên hệ</p>
                                    <p className="text-slate-900 font-bold text-sm mt-0.5 truncate">{selectedMember.email || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                        </div>

                        {onStartDirectChat && selectedMember.id !== localStorage.getItem('user_id') && (
                            <button
                                onClick={() => {
                                    onStartDirectChat(selectedMember.id, selectedMember.name)
                                    setSelectedMember(null)
                                }}
                                className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 text-sm"
                            >
                                Trò chuyện riêng
                            </button>
                        )}

                        <button 
                            onClick={() => setSelectedMember(null)}
                            className="w-full mt-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all text-sm"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
