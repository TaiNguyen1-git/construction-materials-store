import { AlertTriangle, LifeBuoy, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PerformanceAlert {
    type: 'warning' | 'critical' | 'info'
    title: string
    description: string
    action: string
    link: string
    icon: React.ElementType
}

interface PerformanceAlertsProps {
    alerts: PerformanceAlert[]
}

export default function PerformanceAlerts({ alerts }: PerformanceAlertsProps) {
    if (alerts.length === 0) return null

    return (
        <div className="bg-white rounded-[2rem] border border-amber-200/60 shadow-sm overflow-hidden">
            <div className="p-5 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Cảnh báo hiệu suất</h3>
                        <p className="text-xs text-slate-500">{alerts.length} vấn đề cần lưu ý</p>
                    </div>
                </div>
                <Link href="/supplier/support" className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700">
                    <LifeBuoy className="w-3.5 h-3.5" />
                    Hỗ trợ
                </Link>
            </div>
            <div className="divide-y divide-slate-50">
                {alerts.map((alert, i) => (
                    <Link
                        key={i}
                        href={alert.link}
                        className={`flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors group ${
                            alert.type === 'critical' ? 'border-l-4 border-l-red-500' : 
                            alert.type === 'warning' ? 'border-l-4 border-l-amber-400' : 
                            'border-l-4 border-l-blue-400'
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            alert.type === 'critical' ? 'bg-red-50' : 
                            alert.type === 'warning' ? 'bg-amber-50' : 
                            'bg-blue-50'
                        }`}>
                            <alert.icon className={`w-5 h-5 ${
                                alert.type === 'critical' ? 'text-red-500' : 
                                alert.type === 'warning' ? 'text-amber-500' : 
                                'text-blue-500'
                            }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900">{alert.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{alert.description}</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform whitespace-nowrap">
                            {alert.action}
                            <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    )
}
