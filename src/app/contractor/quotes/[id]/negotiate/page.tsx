'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import NegotiationRoom from '@/components/NegotiationRoom'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export default function ContractorNegotiatePage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string
    const [quote, setQuote] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get User Info from localStorage (consistent with other pages)
                const userData = localStorage.getItem('user')
                const token = localStorage.getItem('access_token')

                if (!userData || !token) {
                    router.push('/contractor/login')
                    return
                }

                const parsedUser = JSON.parse(userData)
                setUser(parsedUser)

                // Fetch Quote Data with Auth Headers
                const quoteRes = await fetch(`/api/quotes/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-user-id': parsedUser.id
                    }
                })

                if (!quoteRes.ok) {
                    throw new Error('Failed to fetch quote')
                }

                const quoteData = await quoteRes.json()
                if (!quoteData.success) {
                    toast.error('Không tìm thấy báo giá')
                    router.push('/contractor/quotes')
                    return
                }
                setQuote(quoteData.data)
            } catch (err) {
                console.error(err)
                toast.error('Lỗi khi tải dữ liệu. Vui lòng đăng nhập lại.')
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchData()
    }, [id, router])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">Đang thiết lập phòng thương thảo...</p>
            </div>
        )
    }

    if (!quote || !user) return null

    return (
        <NegotiationRoom
            quoteId={id}
            userId={user.id}
            userName={user.name}
            role="contractor"
            initialBoQ={quote.items || []}
        />
    )
}
