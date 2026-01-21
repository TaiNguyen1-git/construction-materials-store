'use client'

/**
 * Contractor Dashboard
 * Main dashboard for verified contractors with Financial Insights
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import ContractorHeader from '../components/ContractorHeader'
import SuggestedProjectsWidget from '../components/SuggestedProjectsWidget'
import NotificationPrefsWidget from '../components/NotificationPrefsWidget'
import WorkerReportWidget from '../components/WorkerReportWidget'
import FinancialDashboard from '@/components/contractor/FinancialDashboard'
import ContractorOnboardingBanner from '@/components/ContractorOnboardingBanner'
import TrustScoreWidget from '../components/TrustScoreWidget'
import { Building2 } from 'lucide-react'

export default function ContractorDashboardPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            fetchProfile()
        } else {
            router.push('/login')
        }
    }, [router])

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const userStored = localStorage.getItem('user')
            const userId = userStored ? JSON.parse(userStored).id : null

            const res = await fetch('/api/contractors/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-user-id': userId || ''
                }
            })

            if (res.ok) {
                const result = await res.json()
                setProfile(result.data)
            }
        } catch (err) {
            console.error('Error fetching profile:', err)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className={`flex-1 pt-[73px] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Onboarding Banner */}
                    <ContractorOnboardingBanner user={user} profile={profile} />

                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold mb-2 text-white">
                                Chào mừng quay trở lại{user?.name ? `, ${user.name.split(' ').pop()}` : ''}! 👋
                            </h1>
                            <p className="text-blue-100 max-w-md">
                                Hệ thống đã tự động cập nhật dòng tiền và các dự án mới phù hợp với chuyên môn của bạn.
                            </p>
                        </div>
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                            <Building2 className="w-32 h-32" />
                        </div>
                    </div>

                    {/* Financial Dashboard (AI-Powered) */}
                    <div className="mb-8">
                        <FinancialDashboard />
                    </div>

                    {/* Preferences, Suggestions and Worker Reports */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        <TrustScoreWidget
                            score={profile?.trustScore || 85}
                            completedProjects={profile?.totalProjectsCompleted || 12}
                            verified={profile?.isVerified || false}
                        />
                        <WorkerReportWidget projectId="active" />
                        <NotificationPrefsWidget />
                        <SuggestedProjectsWidget />
                    </div>
                </div>
            </main>
        </div>
    )
}
