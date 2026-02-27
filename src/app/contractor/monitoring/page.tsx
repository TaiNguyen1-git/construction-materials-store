'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Map as MapIcon, Users, AlertTriangle, Crosshair, RefreshCw, Navigation } from 'lucide-react'
import ContractorHeader from '../components/ContractorHeader'
import Sidebar from '../components/Sidebar'
import { fetchWithAuth } from '@/lib/api-client'
import toast, { Toaster } from 'react-hot-toast'

interface Project {
    id: string
    title: string
    lat: number
    lng: number
}

interface WorkerReport {
    id: string
    workerName: string
    lat: number
    lng: number
    photoUrl: string
    createdAt: string
    project: {
        title: string
        lat: number
        lng: number
    }
}

export default function ContractorMonitoringPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [data, setData] = useState<{ projects: Project[], reports: WorkerReport[] } | null>(null)
    const [loading, setLoading] = useState(true)
    const mapRef = useRef<HTMLDivElement>(null)
    const leafletRef = useRef<any>(null)

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth('/api/contractor/monitoring')
            const result = await res.json()
            if (result.success) {
                setData(result.data)
            }
        } catch (error) {
            toast.error('Lỗi tải dữ liệu giám sát')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (data && !loading && typeof window !== 'undefined') {
            loadLeaflet()
        }
    }, [data, loading])

    const loadLeaflet = () => {
        if (leafletRef.current) return

        // Check if Leaflet is already on the page
        if ((window as any).L) {
            initMap((window as any).L)
            return
        }

        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = () => initMap((window as any).L)
        document.head.appendChild(script)
    }

    const initMap = (L: any) => {
        if (!mapRef.current || leafletRef.current) return

        const map = L.map(mapRef.current).setView([10.9482, 106.8223], 13) // Default to Bien Hoa
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map)

        leafletRef.current = map

        // Add Projects (Blue Markers)
        data?.projects.forEach(p => {
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
            L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(`<b>Công trình:</b> ${p.title}`)
        })

        // Add Reports (Orange/Red Markers)
        data?.reports.forEach(r => {
            const distance = getDistance(r.lat, r.lng, r.project.lat, r.project.lng)
            const isFraud = distance > 300

            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-10 h-10 ${isFraud ? 'bg-red-500' : 'bg-emerald-500'} rounded-2xl border-2 border-white shadow-xl flex items-center justify-center text-white overflow-hidden"><img src="${r.photoUrl}" class="w-full h-full object-cover"/></div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })

            L.marker([r.lat, r.lng], { icon }).addTo(map).bindPopup(`
                <div class="p-2 w-48">
                    <p class="font-black text-xs uppercase mb-1">Báo cáo từ: ${r.workerName}</p>
                    <p class="text-[10px] text-slate-500 mb-2">${new Date(r.createdAt).toLocaleString()}</p>
                    <div class="h-32 w-full bg-slate-100 rounded-lg overflow-hidden mb-2">
                        <img src="${r.photoUrl}" class="w-full h-full object-cover"/>
                    </div>
                    <p class="text-[10px] ${isFraud ? 'text-red-600 font-black' : 'text-emerald-600 font-bold'}">
                        ${isFraud ? `⚠️ SAI VỊ TRÍ (${Math.round(distance)}m)` : '✅ Hợp lệ'}
                    </p>
                </div>
            `)
        })
    }

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3
        const φ1 = (lat1 * Math.PI) / 180
        const φ2 = (lat2 * Math.PI) / 180
        const Δφ = ((lat2 - lat1) * Math.PI) / 180
        const Δλ = ((lon2 - lon1) * Math.PI) / 180
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Toaster position="top-right" />
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'} bg-slate-50 relative h-screen flex flex-col`}>
                <div className="h-16 w-full shrink-0" /> {/* Spacer */}

                <div className="flex-1 relative flex flex-col">
                    {/* Header Overlay */}
                    <div className="absolute top-6 left-6 right-6 z-10 flex flex-col md:flex-row gap-4 pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-white/20 pointer-events-auto">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <MapIcon size={24} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase italic">
                                        Giám Sát Hiện Trường
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                                    </h1>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hệ thống theo dõi báo cáo công nhân vặn hành AI</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pointer-events-auto">
                            <div className="bg-white/90 backdrop-blur-xl px-6 py-4 rounded-[1.5rem] shadow-xl flex items-center gap-3">
                                <Users className="text-blue-600" size={18} />
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Báo cáo</p>
                                    <p className="text-lg font-black text-slate-900 leading-none">{data?.reports.length || 0}</p>
                                </div>
                            </div>
                            <div className="bg-white/90 backdrop-blur-xl px-6 py-4 rounded-[1.5rem] shadow-xl flex items-center gap-3">
                                <AlertTriangle className="text-red-500" size={18} />
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cảnh báo</p>
                                    <p className="text-lg font-black text-red-600 leading-none">
                                        {data?.reports.filter(r => getDistance(r.lat, r.lng, r.project.lat, r.project.lng) > 300).length || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Container */}
                    <div ref={mapRef} className="flex-1 bg-slate-200" />

                    {/* Controls */}
                    <div className="absolute bottom-10 right-10 z-10 flex flex-col gap-3">
                        <button
                            onClick={fetchData}
                            className="w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-slate-900 hover:bg-slate-50 active:scale-95 transition-all border border-slate-100"
                        >
                            <RefreshCw className={loading ? 'animate-spin' : ''} size={24} />
                        </button>
                        <button className="w-14 h-14 bg-blue-600 rounded-full shadow-2xl shadow-blue-500/30 flex items-center justify-center text-white hover:bg-blue-700 active:scale-95 transition-all">
                            <Crosshair size={24} />
                        </button>
                    </div>

                    {/* Report Sidebar Panel (Compact) */}
                    <div className="absolute right-6 top-40 bottom-10 w-80 z-10 hidden xl:flex flex-col gap-4 pointer-events-none">
                        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20 p-6 overflow-hidden flex flex-col flex-1 pointer-events-auto">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Navigation size={14} className="text-blue-600" />
                                Nhật ký mới nhất
                            </h3>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {data?.reports.map(r => {
                                    const distance = getDistance(r.lat, r.lng, r.project.lat, r.project.lng)
                                    const isFraud = distance > 300
                                    return (
                                        <div key={r.id} className={`p-4 rounded-3xl border ${isFraud ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'} transition-all hover:scale-[1.02]`}>
                                            <div className="flex gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 border border-white shadow-sm">
                                                    <img src={r.photoUrl} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-black text-slate-900 truncate uppercase">{r.workerName}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                            <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isFraud ? 'text-red-600' : 'text-emerald-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isFraud ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                                {isFraud ? `SAI VỊ TRÍ (${Math.round(distance)}M)` : 'Hợp lệ'}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <style jsx global>{`
                .custom-div-icon { background: none; border: none; }
                .leaflet-popup-content-wrapper { border-radius: 20px; padding: 0; overflow: hidden; }
                .leaflet-popup-content { margin: 0; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    )
}
