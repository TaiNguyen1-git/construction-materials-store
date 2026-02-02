'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import NegotiationRoom from '@/components/NegotiationRoom'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/auth-context'
import { fetchWithAuth } from '@/lib/api-client'

export default function CustomerNegotiatePage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string
    const { user } = useAuth()
    const [quote, setQuote] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return
            try {
                // Fetch Quote Data with fetchWithAuth
                const quoteRes = await fetchWithAuth(`/api/quotes/${id}`)

                if (!quoteRes.ok) {
                    throw new Error('Failed to fetch quote')
                }

                const quoteData = await quoteRes.json()
                if (!quoteData.success) {
                    toast.error('Không tìm thấy báo giá')
                    router.push('/account/quotes')
                    return
                }
                setQuote(quoteData.data)
            } catch (err) {
                console.error(err)
                toast.error('Lỗi khi tải dữ liệu.')
            } finally {
                setLoading(false)
            }
        }

        if (id && user) fetchData()
    }, [id, router, user])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
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
            role="customer"
            initialBoQ={quote.items || []}
        />
    )
}
