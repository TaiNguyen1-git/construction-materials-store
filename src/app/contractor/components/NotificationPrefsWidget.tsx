'use client'

/**
 * Notification Preferences Widget
 * Allows contractors to set their project match preferences
 */

import { useState, useEffect } from 'react'
import { Bell, MapPin, Wrench, Check, X, Loader2, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'

// Helper function removed in favor of centralized api-client

interface NotificationPrefs {
    skills: string[]
    city: string | null
    district: string | null
    isAvailable: boolean
}

const SKILL_OPTIONS = [
    'Xây nhà phố', 'Biệt thự', 'Sửa chữa', 'Cải tạo', 'Nội thất',
    'Sơn', 'Điện', 'Nước', 'Mái', 'Gạch'
]

const CITY_OPTIONS = [
    'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai',
    'Long An', 'Bà Rịa - Vũng Tàu', 'Cần Thơ', 'Khánh Hòa', 'Lâm Đồng'
]

export default function NotificationPrefsWidget() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [prefs, setPrefs] = useState<NotificationPrefs>({
        skills: [],
        city: null,
        district: null,
        isAvailable: true
    })
    const [hasProfile, setHasProfile] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [recentProjects, setRecentProjects] = useState<any[]>([])
    const [matchCount, setMatchCount] = useState(0)

    useEffect(() => {
        fetchPrefs()
        fetchRecentProjects()
    }, [])

    const fetchRecentProjects = async () => {
        try {
            const res = await fetchWithAuth('/api/marketplace/projects/suggested')
            if (res.ok) {
                const data = await res.json()
                if (data.success && data.data) {
                    const combined = [
                        ...(data.data.urgent || []),
                        ...(data.data.matching || []),
                        ...(data.data.recent || [])
                    ]
                    setMatchCount(combined.length)
                    setRecentProjects(combined.slice(0, 5))
                }
            }
        } catch (err) {
            console.error('Failed to fetch recent projects')
        }
    }

    const fetchPrefs = async () => {
        try {
            const res = await fetchWithAuth('/api/contractors/notifications')
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setHasProfile(data.data.hasProfile)
                    if (data.data.preferences) {
                        setPrefs(data.data.preferences)
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch prefs:', err)
        } finally {
            setLoading(false)
        }
    }

    const savePrefs = async () => {
        setSaving(true)
        try {
            const res = await fetchWithAuth('/api/contractors/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prefs)
            })

            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    toast.success('Đã lưu cài đặt thông báo!')
                    setHasProfile(true)
                    fetchRecentProjects() // Refresh count after saving
                    setExpanded(false) // Close settings after save
                } else {
                    toast.error(data.error?.message || 'Lỗi lưu cài đặt')
                }
            }
        } catch (err) {
            toast.error('Lỗi kết nối')
        } finally {
            setSaving(false)
        }
    }

    const toggleSkill = (skill: string) => {
        if (prefs.skills.includes(skill)) {
            setPrefs({ ...prefs, skills: prefs.skills.filter(s => s !== skill) })
        } else {
            setPrefs({ ...prefs, skills: [...prefs.skills, skill] })
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${matchCount > 0 ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <Bell className={`w-5 h-5 ${matchCount > 0 ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Thông báo dự án</h3>
                        <p className={`text-xs ${matchCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                            {prefs.isAvailable
                                ? (matchCount > 0
                                    ? `Có ${matchCount} dự án mới`
                                    : 'Chưa có thông báo')
                                : 'Đã tắt'
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={`p-2 rounded-lg transition-colors ${expanded ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                        title="Cài đặt thông báo"
                    >
                        <Wrench className="w-5 h-5" />
                    </button>
                    {prefs.isAvailable ? (
                        <button onClick={() => setPrefs({ ...prefs, isAvailable: false })} className="text-green-600"><ToggleRight className="w-8 h-8" /></button>
                    ) : (
                        <button onClick={() => setPrefs({ ...prefs, isAvailable: true })} className="text-gray-400"><ToggleLeft className="w-8 h-8" /></button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 overflow-y-auto min-h-[200px]">
                {expanded ? (
                    <div className="animate-in slide-in-from-top-2">
                        {/* Settings Form */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 block mb-2">Loại công trình nhận tin</label>
                            <div className="flex flex-wrap gap-2">
                                {SKILL_OPTIONS.map(skill => (
                                    <button
                                        key={skill}
                                        onClick={() => toggleSkill(skill)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${prefs.skills.includes(skill)
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        {skill}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="text-sm font-medium text-gray-700 block mb-2">Khu vực hoạt động</label>
                            <select
                                value={prefs.city || ''}
                                onChange={(e) => setPrefs({ ...prefs, city: e.target.value || null })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                            >
                                <option value="">Toàn quốc</option>
                                {CITY_OPTIONS.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={savePrefs}
                            disabled={saving}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Lưu Cài Đặt
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 h-full">
                        {/* Notifications List */}
                        {recentProjects.length > 0 ? (
                            recentProjects.map((project) => (
                                <a
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    className="block p-3 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-xl transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-white text-blue-600 rounded border border-blue-100 shadow-sm">
                                            {project.projectType === 'NEW_CONSTRUCTION' ? 'Xây mới' : 'Cải tạo'}
                                        </span>
                                        {project.isUrgent && <span className="text-[10px] font-black text-red-500 animate-pulse">GẤP</span>}
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-700">{project.title}</h4>
                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 font-medium">
                                        <MapPin className="w-3 h-3" />
                                        {project.location}, {project.city}
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
                                <div className="p-4 bg-gray-50 rounded-full mb-3">
                                    <Bell className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium">Chưa có thông báo nào</p>
                                <p className="text-xs mt-1">Hệ thống sẽ báo khi có dự án phù hợp với cài đặt của bạn</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
