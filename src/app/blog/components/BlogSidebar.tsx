'use client'

import { useState, useEffect } from 'react'
import { List, Mail, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'

interface BlogSidebarProps {
    content: string
}

export default function BlogSidebar({ content }: BlogSidebarProps) {
    const { user, isAuthenticated } = useAuth()
    const [toc, setToc] = useState<{ id: string, text: string, level: number }[]>([])
    const [emailSub, setEmailSub] = useState('')
    const [subLoading, setSubLoading] = useState(false)

    useEffect(() => {
        if (isAuthenticated && user) {
            setEmailSub(user.email || '')
        }
    }, [isAuthenticated, user])

    useEffect(() => {
        const doc = new DOMParser().parseFromString(content, 'text/html')
        const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
        const tocData = headings.map((h, i) => {
            const id = `heading-${i}`
            return { id, text: h.textContent || '', level: parseInt(h.tagName[1]) }
        })
        setToc(tocData)
    }, [content])

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!emailSub) return
        setSubLoading(true)
        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailSub })
            })
            if (res.ok) {
                toast.success('Đăng ký nhận cẩm nang thành công!')
                setEmailSub('')
            }
        } catch (error) { toast.error('Lỗi khi đăng ký') }
        finally { setSubLoading(false) }
    }

    return (
        <div className="sticky top-32 space-y-10">
            {toc.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] flex items-center gap-3">
                        <List className="w-3.5 h-3.5" /> MỤC LỤC
                    </h3>
                    <div className="space-y-4">
                        {toc.map((item) => (
                            <a 
                                key={item.id}
                                href={`#${item.id}`}
                                className={`block text-xs font-bold leading-relaxed transition-all hover:text-primary-600 ${item.level === 3 ? 'pl-4 text-neutral-400' : 'text-neutral-600'}`}
                            >
                                {item.text}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Newsletter Mini Widget */}
            <form onSubmit={handleSubscribe} className="p-8 bg-blue-50 border border-blue-100 rounded-[32px] text-blue-900 shadow-sm">
                <Mail className="w-6 h-6 text-blue-600 mb-6" />
                <h4 className="text-sm font-black mb-4 leading-tight">Nhận cẩm nang xây dựng</h4>
                <p className="text-[10px] text-blue-600/70 font-medium leading-relaxed mb-6">Mẹo tối ưu chi phí và kỹ thuật mới mỗi tuần.</p>
                
                <input 
                    type="email" 
                    required
                    value={emailSub}
                    onChange={(e) => setEmailSub(e.target.value)}
                    placeholder="Email của bạn..." 
                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-[11px] outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition-all" 
                />
                
                <button type="submit" disabled={subLoading} className="w-full py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase text-white tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50">
                    {subLoading ? 'Đang gửi...' : 'Đăng ký nhận'}
                </button>
            </form>
        </div>
    )
}
