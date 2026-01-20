'use client'

/**
 * Notification Preferences Widget
 * Allows contractors to set their project match preferences
 */

import { useState, useEffect } from 'react'
import { Bell, MapPin, Wrench, Check, X, Loader2, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

// Helper function to fetch with auth token
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('access_token')
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': token ? `Bearer ${token}` : ''
        }
    })
}

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

    useEffect(() => {
        fetchPrefs()
    }, [])

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
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Thông báo dự án mới</h3>
                        <p className="text-sm text-gray-500">
                            {prefs.isAvailable
                                ? `Đang nhận thông báo ${prefs.city ? `tại ${prefs.city}` : 'toàn quốc'}`
                                : 'Đã tắt thông báo'
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setPrefs({ ...prefs, isAvailable: !prefs.isAvailable })
                        }}
                        className="p-1"
                    >
                        {prefs.isAvailable
                            ? <ToggleRight className="w-8 h-8 text-green-600" />
                            : <ToggleLeft className="w-8 h-8 text-gray-400" />
                        }
                    </button>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="p-4 pt-0 border-t border-gray-100">
                    {/* Skills */}
                    <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                            <Wrench className="w-4 h-4" />
                            Nhận thông báo dự án loại
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SKILL_OPTIONS.map(skill => (
                                <button
                                    key={skill}
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${prefs.skills.includes(skill)
                                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {prefs.skills.includes(skill) && <Check className="w-3 h-3 inline mr-1" />}
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4" />
                            Khu vực hoạt động
                        </label>
                        <select
                            value={prefs.city || ''}
                            onChange={(e) => setPrefs({ ...prefs, city: e.target.value || null })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Toàn quốc</option>
                            {CITY_OPTIONS.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    {/* Save button */}
                    <button
                        onClick={savePrefs}
                        disabled={saving}
                        className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Lưu cài đặt
                            </>
                        )}
                    </button>

                    {/* Note */}
                    <p className="text-xs text-gray-500 text-center mt-3">
                        Bạn sẽ nhận thông báo khi có dự án phù hợp với cài đặt trên
                    </p>
                </div>
            )}
        </div>
    )
}
