'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import {
    Wallet,
    TrendingUp,
    Users,
    ArrowUpRight,
    ArrowDownLeft,
    Copy,
    CheckCircle2,
    Clock,
    DollarSign,
    Share2,
    X,
    Loader2,
    Building2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ContractorWalletPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const [withdrawing, setWithdrawing] = useState(false)
    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        bankName: '',
        accountNumber: '',
        accountHolder: ''
    })
    const router = useRouter()

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
            fetchWalletData()
        } else {
            router.push('/login')
        }
    }, [router])

    const fetchWalletData = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const userStored = localStorage.getItem('user')
            const userId = userStored ? JSON.parse(userStored).id : null

            const res = await fetch('/api/contractors/wallet', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-user-id': userId || ''
                }
            })

            const result = await res.json()
            if (result.success) {
                setData(result.data)
            }
        } catch (err) {
            console.error('Error fetching wallet:', err)
        } finally {
            setLoading(false)
        }
    }

    const copyReferralCode = () => {
        if (data?.referralCode) {
            navigator.clipboard.writeText(data.referralCode)
            toast.success('Đã sao chép mã giới thiệu!')
        }
    }

    const handleWithdraw = async () => {
        const amount = parseInt(withdrawForm.amount.replace(/[^\d]/g, ''))
        const wallet = data?.wallet || { balance: 0 }

        if (!amount || amount < 50000) {
            toast.error('Số tiền rút tối thiểu là 50.000đ')
            return
        }
        if (amount > wallet.balance) {
            toast.error('Số dư không đủ')
            return
        }
        if (!withdrawForm.bankName || !withdrawForm.accountNumber || !withdrawForm.accountHolder) {
            toast.error('Vui lòng điền đầy đủ thông tin ngân hàng')
            return
        }

        setWithdrawing(true)
        try {
            const token = localStorage.getItem('access_token')
            const userStored = localStorage.getItem('user')
            const userId = userStored ? JSON.parse(userStored).id : null

            const res = await fetch('/api/contractors/wallet/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-user-id': userId || ''
                },
                body: JSON.stringify({
                    amount,
                    bankName: withdrawForm.bankName,
                    accountNumber: withdrawForm.accountNumber,
                    accountHolder: withdrawForm.accountHolder
                })
            })

            const result = await res.json()
            if (result.success) {
                toast.success('Yêu cầu rút tiền đã được gửi! Chúng tôi sẽ xử lý trong 24h.')
                setShowWithdrawModal(false)
                setWithdrawForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' })
                fetchWalletData() // Refresh wallet data
            } else {
                toast.error(result.error?.message || 'Không thể xử lý yêu cầu rút tiền')
            }
        } catch (err) {
            console.error('Withdraw error:', err)
            toast.error('Lỗi kết nối. Vui lòng thử lại.')
        } finally {
            setWithdrawing(false)
        }
    }

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Đang tải...</div>
    }

    const wallet = data?.wallet || { balance: 0, totalEarned: 0, transactions: [] }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Withdraw Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Building2 className="w-6 h-6" />
                                    Rút tiền về ngân hàng
                                </h2>
                                <p className="text-primary-100 text-sm mt-1">Số dư khả dụng: {wallet.balance?.toLocaleString()}đ</p>
                            </div>
                            <button onClick={() => setShowWithdrawModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền muốn rút *</label>
                                <input
                                    type="text"
                                    value={withdrawForm.amount}
                                    onChange={(e) => {
                                        const rawVal = e.target.value.replace(/[^\d]/g, '')
                                        const formatted = rawVal ? parseInt(rawVal).toLocaleString('vi-VN') : ''
                                        setWithdrawForm(prev => ({ ...prev, amount: formatted }))
                                    }}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-bold"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-400 mt-1">Tối thiểu 50.000đ</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tên ngân hàng *</label>
                                <input
                                    type="text"
                                    value={withdrawForm.bankName}
                                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, bankName: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="VD: Vietcombank, MB Bank..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Số tài khoản *</label>
                                <input
                                    type="text"
                                    value={withdrawForm.accountNumber}
                                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Nhập số tài khoản"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tên chủ tài khoản *</label>
                                <input
                                    type="text"
                                    value={withdrawForm.accountHolder}
                                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountHolder: e.target.value.toUpperCase() }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                                    placeholder="NGUYEN VAN A"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowWithdrawModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={withdrawing}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl hover:from-primary-700 hover:to-indigo-700 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {withdrawing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUpRight className="w-4 h-4" />
                                            Gửi yêu cầu
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className={`flex-1 pt-[60px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Ví Hoa Hồng & Affiliate</h1>
                            <p className="text-gray-500">Quản lý thu nhập từ giới thiệu và chiết khấu dự án</p>
                        </div>
                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            disabled={!wallet.balance || wallet.balance < 50000}
                            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            Rút tiền về ngân hàng
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Current Balance */}
                        <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-primary-100 text-sm font-medium">Số dư khả dụng</span>
                                    <Wallet className="w-5 h-5 text-primary-200" />
                                </div>
                                <div className="text-3xl font-black">{wallet.balance?.toLocaleString()}đ</div>
                                <div className="flex items-center gap-2 text-primary-100 text-xs bg-white/10 w-fit px-2 py-1 rounded-lg">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>Tiền có thể dùng thanh toán đơn hàng</span>
                                </div>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        </div>

                        {/* Total Earned */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-500 text-sm font-medium">Tổng thu nhập</span>
                                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{wallet.totalEarned?.toLocaleString()}đ</div>
                            <div className="text-xs text-green-600 font-bold mt-2">+12% so với tháng trước</div>
                        </div>

                        {/* Total Referrals */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-500 text-sm font-medium">Người đã giới thiệu</span>
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{data?.totalReferrals || 0} khách</div>
                            <div className="text-xs text-gray-500 mt-2">Tính từ khi bắt đầu chương trình</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Referral Portal */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <Share2 className="w-5 h-5 text-primary-600" />
                                    <h2 className="font-bold text-gray-900">Mã giới thiệu của bạn</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center relative group">
                                        <div className="text-2xl font-black text-primary-700 tracking-widest uppercase">
                                            {data?.referralCode || 'SMART-B2B'}
                                        </div>
                                        <button
                                            onClick={copyReferralCode}
                                            className="absolute top-2 right-2 p-1.5 bg-white rounded-md shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Copy className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-500 italic leading-relaxed">
                                        * Nhận ngay 2% hoa hồng vĩnh viễn cho mỗi đơn hàng mà khách hàng bạn giới thiệu thực hiện thành công.
                                    </p>

                                    <button className="w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                                        <Share2 className="w-4 h-4" />
                                        Chia sẻ link ngay
                                    </button>
                                </div>
                            </div>

                            <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-lg">
                                <h3 className="font-bold mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                                    Tăng thu nhập?
                                </h3>
                                <p className="text-sm text-indigo-200 mb-4 leading-relaxed">
                                    Giới thiệu thêm 5 nhà thầu khác để được nâng cấp lên hạng <b>"Đại lý Ưu tiên"</b> với mức hoa hồng <b>3.5%</b>.
                                </p>
                                <div className="w-full bg-white/10 h-2 rounded-full mb-2">
                                    <div className="bg-indigo-400 h-full rounded-full" style={{ width: '60%' }} />
                                </div>
                                <div className="text-[10px] text-indigo-300">3/5 nhà thầu đã tham gia</div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
                                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                    <h2 className="font-bold text-gray-900">Lịch sử giao dịch</h2>
                                    <button className="text-sm text-primary-600 font-bold hover:underline">Xem tất cả</button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4 font-bold">Thời gian</th>
                                                <th className="px-6 py-4 font-bold">Mô tả</th>
                                                <th className="px-6 py-4 font-bold">Loại</th>
                                                <th className="px-6 py-4 font-bold text-right">Số tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {wallet.transactions.length > 0 ? (
                                                wallet.transactions.map((tx: any) => (
                                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900 line-clamp-1">{tx.description}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tx.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {tx.type === 'COMMISSION' ? 'Hoa hồng' : tx.type === 'ESCROW_RELEASE' ? 'Giải ngân' : 'Giao dịch'}
                                                            </span>
                                                        </td>
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-black text-right ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}đ
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                                                        Chưa có giao dịch nào phát sinh
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
