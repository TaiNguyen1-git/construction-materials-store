'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import {
    ArrowLeft,
    MapPin,
    Plus,
    Edit2,
    Trash2,
    Home,
    Building2,
    Star,
    Phone,
    User,
    X,
    Save,
    Loader2,
    CheckCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface Address {
    id: string
    label: string
    fullName: string
    phone: string
    address: string
    city: string
    district: string
    ward: string
    isDefault: boolean
    type: 'home' | 'office' | 'other'
}

export default function AddressesPage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const [addresses, setAddresses] = useState<Address[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingAddress, setEditingAddress] = useState<Address | null>(null)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState<Omit<Address, 'id'>>({
        label: '',
        fullName: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        isDefault: false,
        type: 'home'
    })

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [authLoading, isAuthenticated, router])

    useEffect(() => {
        loadAddresses()
    }, [])

    const loadAddresses = () => {
        setLoading(true)
        try {
            const saved = localStorage.getItem('user_addresses')
            if (saved) {
                setAddresses(JSON.parse(saved))
            } else {
                // Default address from user profile
                if (user?.address) {
                    const defaultAddr: Address = {
                        id: '1',
                        label: 'Địa chỉ chính',
                        fullName: user.name || '',
                        phone: user.phone || '',
                        address: user.address,
                        city: 'TP. Hồ Chí Minh',
                        district: '',
                        ward: '',
                        isDefault: true,
                        type: 'home'
                    }
                    setAddresses([defaultAddr])
                    localStorage.setItem('user_addresses', JSON.stringify([defaultAddr]))
                }
            }
        } catch (e) {
            console.error('Failed to load addresses', e)
        } finally {
            setLoading(false)
        }
    }

    const saveAddresses = (newAddresses: Address[]) => {
        localStorage.setItem('user_addresses', JSON.stringify(newAddresses))
        setAddresses(newAddresses)
    }

    const handleOpenModal = (address?: Address) => {
        if (address) {
            setEditingAddress(address)
            setForm({
                label: address.label,
                fullName: address.fullName,
                phone: address.phone,
                address: address.address,
                city: address.city,
                district: address.district,
                ward: address.ward,
                isDefault: address.isDefault,
                type: address.type
            })
        } else {
            setEditingAddress(null)
            setForm({
                label: '',
                fullName: user?.name || '',
                phone: user?.phone || '',
                address: '',
                city: '',
                district: '',
                ward: '',
                isDefault: addresses.length === 0,
                type: 'home'
            })
        }
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
            return
        }

        setSaving(true)
        await new Promise(r => setTimeout(r, 500)) // Simulate API

        try {
            let newAddresses: Address[]

            if (editingAddress) {
                newAddresses = addresses.map(a =>
                    a.id === editingAddress.id
                        ? { ...a, ...form }
                        : form.isDefault ? { ...a, isDefault: false } : a
                )
            } else {
                const newAddress: Address = {
                    ...form,
                    id: Date.now().toString()
                }
                if (form.isDefault) {
                    newAddresses = addresses.map(a => ({ ...a, isDefault: false }))
                    newAddresses.push(newAddress)
                } else {
                    newAddresses = [...addresses, newAddress]
                }
            }

            saveAddresses(newAddresses)
            setShowModal(false)
            toast.success(editingAddress ? 'Cập nhật địa chỉ thành công!' : 'Thêm địa chỉ thành công!')
        } catch (e) {
            toast.error('Có lỗi xảy ra')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (id: string) => {
        if (confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
            const newAddresses = addresses.filter(a => a.id !== id)
            saveAddresses(newAddresses)
            toast.success('Đã xóa địa chỉ')
        }
    }

    const handleSetDefault = (id: string) => {
        const newAddresses = addresses.map(a => ({
            ...a,
            isDefault: a.id === id
        }))
        saveAddresses(newAddresses)
        toast.success('Đã đặt làm địa chỉ mặc định')
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'home': return <Home className="w-4 h-4" />
            case 'office': return <Building2 className="w-4 h-4" />
            default: return <MapPin className="w-4 h-4" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'home': return 'Nhà riêng'
            case 'office': return 'Văn phòng'
            default: return 'Khác'
        }
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
            <Toaster position="top-right" />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/account" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Quay lại
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                                Địa Chỉ Đã Lưu
                            </h1>
                            <p className="mt-2 text-gray-600">Quản lý địa chỉ giao hàng và thanh toán</p>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm địa chỉ
                        </button>
                    </div>
                </div>

                {/* Address List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
                        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có địa chỉ nào</h3>
                        <p className="text-gray-500 mb-6">Thêm địa chỉ để thuận tiện khi đặt hàng</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm địa chỉ đầu tiên
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {addresses.map(address => (
                            <div
                                key={address.id}
                                className={`bg-white rounded-2xl shadow-md border-2 p-6 transition-all ${address.isDefault ? 'border-blue-500' : 'border-gray-100 hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${address.type === 'home' ? 'bg-green-100 text-green-700' :
                                                address.type === 'office' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {getTypeIcon(address.type)}
                                                {getTypeLabel(address.type)}
                                            </span>
                                            {address.isDefault && (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                                                    <Star className="w-3 h-3" />
                                                    Mặc định
                                                </span>
                                            )}
                                            {address.label && (
                                                <span className="text-sm font-medium text-gray-500">{address.label}</span>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-gray-900 mb-1">{address.fullName}</h3>
                                        <p className="text-gray-600 flex items-center gap-2 mb-1">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            {address.phone}
                                        </p>
                                        <p className="text-gray-600 flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <span>
                                                {address.address}
                                                {address.ward && `, ${address.ward}`}
                                                {address.district && `, ${address.district}`}
                                                {address.city && `, ${address.city}`}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        {!address.isDefault && (
                                            <button
                                                onClick={() => handleSetDefault(address.id)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Đặt làm mặc định"
                                            >
                                                <Star className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpenModal(address)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(address.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Loại địa chỉ</label>
                                <div className="flex gap-3">
                                    {(['home', 'office', 'other'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setForm({ ...form, type })}
                                            className={`flex-1 py-2.5 px-4 rounded-xl border-2 font-medium flex items-center justify-center gap-2 transition-all ${form.type === type
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {getTypeIcon(type)}
                                            {getTypeLabel(type)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tên gợi nhớ</label>
                                <input
                                    type="text"
                                    value={form.label}
                                    onChange={e => setForm({ ...form, label: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                    placeholder="VD: Nhà, Công ty..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên *</label>
                                    <input
                                        type="text"
                                        value={form.fullName}
                                        onChange={e => setForm({ ...form, fullName: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                        placeholder="Người nhận"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                        placeholder="0909..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ chi tiết *</label>
                                <textarea
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none"
                                    placeholder="Số nhà, tên đường..."
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/TP</label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={e => setForm({ ...form, city: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                        placeholder="TP.HCM"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện</label>
                                    <input
                                        type="text"
                                        value={form.district}
                                        onChange={e => setForm({ ...form, district: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                        placeholder="Quận 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phường/Xã</label>
                                    <input
                                        type="text"
                                        value={form.ward}
                                        onChange={e => setForm({ ...form, ward: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                        placeholder="Phường 1"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.isDefault}
                                    onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Đặt làm địa chỉ mặc định</span>
                            </label>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
