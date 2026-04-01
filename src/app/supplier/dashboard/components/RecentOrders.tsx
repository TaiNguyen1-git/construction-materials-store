import { Package, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RecentOrdersProps {
    recentOrders: any[]
}

export default function RecentOrders({ recentOrders }: RecentOrdersProps) {
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Đơn hàng mới cập nhật
                </h2>
                <button
                    onClick={() => router.push('/supplier/orders')}
                    className="text-sm font-bold text-blue-600 hover:underline"
                >
                    Xem tất cả
                </button>
            </div>
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã Đơn Hàng</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Số lượng</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentOrders.length > 0 ? (
                                recentOrders.map((order, index) => (
                                    <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 text-sm font-bold text-slate-900">{order.orderNumber}</td>
                                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{order.productName}</td>
                                        <td className="px-8 py-5 text-sm font-black text-slate-900">x{order.quantity}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                                                order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                                order.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium text-slate-400">
                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center grayscale opacity-20">
                                            <Package className="w-16 h-16 mb-4" />
                                            <p className="font-bold uppercase tracking-widest">Chưa có đơn hàng nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
