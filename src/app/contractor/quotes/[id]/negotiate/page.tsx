'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import NegotiationRoom from '@/components/NegotiationRoom'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { fetchWithAuth } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'

export default function ContractorNegotiatePage() {
    const params = useParams()
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
        else if (id && !user) {
            // Wait for user to be loaded from useAuth
        }
    }, [id, user])

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
