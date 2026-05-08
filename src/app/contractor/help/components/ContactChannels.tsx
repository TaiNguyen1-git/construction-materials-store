import React from 'react'
import { Phone, MessageCircle, Mail } from 'lucide-react'

export const ContactChannels: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-slate-100">
            {[
                { label: 'Tổng đài hỗ trợ 24/7', value: '1900 68xx', icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Zalo/Chat trực tuyến', value: 'SmartBuild B2B Support', icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Email phòng dự án', value: 'contractor@smartbuild.vn', icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' }
            ].map((contact, i) => (
                <div key={i} className="flex items-center gap-6 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className={`w-14 h-14 ${contact.bg} ${contact.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <contact.icon size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{contact.label}</p>
                        <p className="text-sm font-bold text-slate-900 tracking-tight">{contact.value}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
