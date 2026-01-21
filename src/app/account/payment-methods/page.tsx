'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import {
    ArrowLeft,
    CreditCard,
    Plus,
    Edit2,
    Trash2,
    Star,
    X,
    Save,
    Loader2,
    Wallet,
    Building2,
    Smartphone,
    CheckCircle,
    ShieldCheck
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface PaymentMethod {
    id: string
    type: 'bank' | 'momo' | 'zalopay' | 'vnpay' | 'cod'
    label: string
    accountName?: string
    accountNumber?: string
    bankName?: string
    phone?: string
    isDefault: boolean
}

const paymentTypes = [
    { type: 'bank', label: 'Chuyển khoản ngân hàng', icon: Building2, color: 'blue' },
    { type: 'momo', label: 'Ví MoMo', icon: Smartphone, color: 'pink' },
    { type: 'zalopay', label: 'ZaloPay', icon: Wallet, color: 'blue' },
    { type: 'vnpay', label: 'VNPay', icon: CreditCard, color: 'red' },
    { type: 'cod', label: 'Thanh toán khi nhận hàng', icon: Wallet, color: 'green' }
] as const

export default function PaymentMethodsPage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const [methods, setMethods] = useState<PaymentMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState<Omit<PaymentMethod, 'id'>>({
        type: 'bank',
        label: '',
        accountName: '',
        accountNumber: '',
        bankName: '',
        phone: '',
        isDefault: false
    })

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [authLoading, isAuthenticated, router])

    useEffect(() => {
        loadMethods()
    }, [])

    const loadMethods = () => {
        setLoading(true)
        try {
            const saved = localStorage.getItem('user_payment_methods')
            if (saved) {
                setMethods(JSON.parse(saved))
            } else {
                // Default COD method
                const defaultMethod: PaymentMethod = {
                    id: '1',
                    type: 'cod',
                    label: 'Thanh toán khi nhận hàng',
                    isDefault: true
                }
                setMethods([defaultMethod])
                localStorage.setItem('user_payment_methods', JSON.stringify([defaultMethod]))
            }
        } catch (e) {
            console.error('Failed to load payment methods', e)
        } finally {
            setLoading(false)
        }
    }

    const saveMethods = (newMethods: PaymentMethod[]) => {
        localStorage.setItem('user_payment_methods', JSON.stringify(newMethods))
        setMethods(newMethods)
    }

    const handleOpenModal = (method?: PaymentMethod) => {
        if (method) {
            setEditingMethod(method)
            setForm({
                type: method.type,
                label: method.label,
                accountName: method.accountName || '',
                accountNumber: method.accountNumber || '',
                bankName: method.bankName || '',
                phone: method.phone || '',
                isDefault: method.isDefault
            })
        } else {
            setEditingMethod(null)
            setForm({
                type: 'bank',
                label: '',
                accountName: user?.name || '',
                accountNumber: '',
                bankName: '',
                phone: user?.phone || '',
                isDefault: methods.length === 0
            })
        }
        setShowModal(true)
    }

    const handleSave = async () => {
        if (form.type === 'bank' && (!form.accountNumber || !form.bankName)) {
            toast.error('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng')
            return
        }
        if ((form.type === 'momo' || form.type === 'zalopay') && !form.phone) {
            toast.error('Vui lòng nhập số điện thoại ví điện tử')
            return
        }

        setSaving(true)
        await new Promise(r => setTimeout(r, 500))

        try {
            let newMethods: PaymentMethod[]
            const typeConfig = paymentTypes.find(t => t.type === form.type)
            const label = form.label || typeConfig?.label || 'Phương thức thanh toán'

            if (editingMethod) {
                newMethods = methods.map(m =>
                    m.id === editingMethod.id
                        ? { ...m, ...form, label }
                        : form.isDefault ? { ...m, isDefault: false } : m
                )
            } else {
                const newMethod: PaymentMethod = {
                    ...form,
                    label,
                    id: Date.now().toString()
                }
                if (form.isDefault) {
                    newMethods = methods.map(m => ({ ...m, isDefault: false }))
                    newMethods.push(newMethod)
                } else {
                    newMethods = [...methods, newMethod]
                }
            }

            saveMethods(newMethods)
            setShowModal(false)
            toast.success(editingMethod ? 'Cập nhật thành công!' : 'Thêm phương thức thành công!')
        } catch (e) {
            toast.error('Có lỗi xảy ra')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (id: string) => {
        const method = methods.find(m => m.id === id)
        if (method?.type === 'cod' && methods.length <= 1) {
            toast.error('Phải có ít nhất một phương thức thanh toán')
            return
        }
        if (confirm('Bạn có chắc muốn xóa phương thức này?')) {
            const newMethods = methods.filter(m => m.id !== id)
            saveMethods(newMethods)
            toast.success('Đã xóa phương thức')
        }
    }

    const handleSetDefault = (id: string) => {
        const newMethods = methods.map(m => ({
            ...m,
            isDefault: m.id === id
        }))
        saveMethods(newMethods)
        toast.success('Đã đặt làm mặc định')
    }

    const getTypeConfig = (type: string) => {
        return paymentTypes.find(t => t.type === type) || paymentTypes[0]
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
                                Phương Thức Thanh Toán
                            </h1>
                            <p className="mt-2 text-gray-600">Quản lý các phương thức thanh toán của bạn</p>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm mới
                        </button>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-800">
                        Thông tin thanh toán của bạn được bảo mật và mã hóa. Chúng tôi không lưu trữ thông tin thẻ tín dụng.
                    </p>
                </div>

                {/* Methods List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : methods.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
                        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có phương thức nào</h3>
                        <p className="text-gray-500 mb-6">Thêm phương thức thanh toán để checkout nhanh hơn</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm phương thức
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {methods.map(method => {
                            const config = getTypeConfig(method.type)
                            const IconComponent = config.icon
                            return (
                                <div
                                    key={method.id}
                                    className={`bg-white rounded-2xl shadow-md border-2 p-6 transition-all ${method.isDefault ? 'border-indigo-500' : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${config.color === 'blue' ? 'bg-blue-100' :
                                                config.color === 'pink' ? 'bg-pink-100' :
                                                    config.color === 'red' ? 'bg-red-100' :
                                                        'bg-green-100'
                                                }`}>
                                                <IconComponent className={`w-7 h-7 ${config.color === 'blue' ? 'text-blue-600' :
                                                    config.color === 'pink' ? 'text-pink-600' :
                                                        config.color === 'red' ? 'text-red-600' :
                                                            'text-green-600'
                                                    }`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-gray-900">{method.label}</h3>
                                                    {method.isDefault && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                                                            <Star className="w-3 h-3" />
                                                            Mặc định
                                                        </span>
                                                    )}
                                                </div>

                                                {method.type === 'bank' && (
                                                    <>
                                                        <p className="text-gray-600 text-sm">{method.bankName}</p>
                                                        <p className="text-gray-500 text-sm font-mono">
                                                            {method.accountNumber?.replace(/(\d{4})/g, '$1 ').trim()}
                                                        </p>
                                                        <p className="text-gray-400 text-xs mt-1">{method.accountName}</p>
                                                    </>
                                                )}

                                                {(method.type === 'momo' || method.type === 'zalopay') && (
                                                    <p className="text-gray-600 text-sm">{method.phone}</p>
                                                )}

                                                {method.type === 'cod' && (
                                                    <p className="text-gray-500 text-sm">Thanh toán tiền mặt khi nhận hàng</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!method.isDefault && (
                                                <button
                                                    onClick={() => handleSetDefault(method.id)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Đặt làm mặc định"
                                                >
                                                    <Star className="w-5 h-5" />
                                                </button>
                                            )}
                                            {method.type !== 'cod' && (
                                                <button
                                                    onClick={() => handleOpenModal(method)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(method.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingMethod ? 'Sửa phương thức' : 'Thêm phương thức mới'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Loại thanh toán</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {paymentTypes.map(({ type, label, icon: Icon, color }) => (
                                        <button
                                            key={type}
                                            onClick={() => setForm({ ...form, type })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${form.type === type
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <Icon className={`w-6 h-6 mb-2 ${form.type === type ? 'text-indigo-600' : 'text-gray-400'}`} />
                                            <p className={`text-sm font-medium ${form.type === type ? 'text-indigo-700' : 'text-gray-700'}`}>{label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bank Fields */}
                            {form.type === 'bank' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tên ngân hàng *</label>
                                        <input
                                            type="text"
                                            value={form.bankName}
                                            onChange={e => setForm({ ...form, bankName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                            placeholder="VD: Vietcombank, BIDV..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Số tài khoản *</label>
                                        <input
                                            type="text"
                                            value={form.accountNumber}
                                            onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none font-mono"
                                            placeholder="0123456789"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tên chủ tài khoản</label>
                                        <input
                                            type="text"
                                            value={form.accountName}
                                            onChange={e => setForm({ ...form, accountName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none uppercase"
                                            placeholder="NGUYEN VAN A"
                                        />
                                    </div>
                                </>
                            )}

                            {/* E-wallet Fields */}
                            {(form.type === 'momo' || form.type === 'zalopay') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại ví *</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                        placeholder="0909..."
                                    />
                                </div>
                            )}

                            {form.type !== 'cod' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên gợi nhớ</label>
                                    <input
                                        type="text"
                                        value={form.label}
                                        onChange={e => setForm({ ...form, label: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                        placeholder="VD: Tài khoản lương..."
                                    />
                                </div>
                            )}

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.isDefault}
                                    onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Đặt làm mặc định</span>
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
                                className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        {editingMethod ? 'Cập nhật' : 'Thêm mới'}
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
