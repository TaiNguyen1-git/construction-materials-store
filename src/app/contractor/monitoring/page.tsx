'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Map as MapIcon, Users, AlertTriangle, Crosshair, RefreshCw, Navigation, Loader2, Info, ChevronRight, Projector, Activity } from 'lucide-react'
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
    const [currentTime, setCurrentTime] = useState<string>('')
    const mapRef = useRef<HTMLDivElement>(null)
    const leafletRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetchWithAuth('/api/contractor/monitoring')
            const result = await res.json()
            if (result.success) {
                setData(result.data)
                if (leafletRef.current) {
                    renderMarkers(result.data)
                }
            }
        } catch (error) {
            console.error('Fetch monitoring data error:', error)
            toast.error('Lỗi tải dữ liệu giám sát')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        setCurrentTime(new Date().toLocaleString('vi-VN'))
    }, [])

    useEffect(() => {
        if (data && !loading && typeof window !== 'undefined') {
            loadLeaflet()
        }
    }, [data, loading])

    const loadLeaflet = () => {
        if (leafletRef.current) return

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

        const map = L.map(mapRef.current, { zoomControl: false }).setView([10.9482, 106.8223], 13)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map)

        leafletRef.current = map
        if (data) renderMarkers(data)
    }

    const renderMarkers = (monitoringData: { projects: Project[], reports: WorkerReport[] }) => {
        const L = (window as any).L
        if (!L || !leafletRef.current) return

        // Clear existing markers
        markersRef.current.forEach(m => leafletRef.current.removeLayer(m))
        markersRef.current = []

        // Add Projects (Blue Markers)
        monitoringData.projects.forEach(p => {
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="project-marker">
                            <div class="marker-base bg-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            </div>
                            <div class="marker-title">${p.title}</div>
                       </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
            const m = L.marker([p.lat, p.lng], { icon }).addTo(leafletRef.current).bindPopup(`<b>Công trình:</b> ${p.title}`)
            markersRef.current.push(m)
        })

        // Add Reports (Emerald/Red Markers)
        monitoringData.reports.forEach(r => {
            const distance = getDistance(r.lat, r.lng, r.project.lat, r.project.lng)
            const isFraud = distance > 300

            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="worker-marker ${isFraud ? 'marker-fraud' : 'marker-valid'}">
                            <div class="marker-pulse"></div>
                            <div class="marker-avatar">
                                <img src="${r.photoUrl}" />
                            </div>
                       </div>`,
                iconSize: [44, 44],
                iconAnchor: [22, 22]
            })

            const m = L.marker([r.lat, r.lng], { icon }).addTo(leafletRef.current).bindPopup(`
                <div class="report-popup">
                    <div class="popup-header">
                        <p class="worker-name">${r.workerName}</p>
                        <p class="time">${new Date(r.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <div class="popup-image">
                        <img src="${r.photoUrl}"/>
                    </div>
                    <div class="popup-status">
                        <span class="status-badge ${isFraud ? 'badge-error' : 'badge-success'}">
                            ${isFraud ? `SAI VỊ TRÍ (${Math.round(distance)}m)` : 'VỊ TRÍ HỢP LỆ'}
                        </span>
                    </div>
                </div>
            `, { className: 'premium-popup' })
            markersRef.current.push(m)
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
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
            <Toaster position="top-right" />
            <ContractorHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`flex-1 transition-all duration-500 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'} bg-white relative h-screen flex flex-col`}>
                <div className="h-[60px] w-full shrink-0" /> {/* Top Header Safe Area */}

                <div className="flex-1 relative flex flex-col m-8 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 bg-slate-50">
                    {/* Header Overlay */}
                    <div className="absolute top-8 left-8 right-8 z-10 flex flex-col lg:flex-row gap-6 pointer-events-none">
                        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-[2rem] shadow-2xl border border-white/50 pointer-events-auto flex items-center gap-6 group hover:bg-white/90 transition-all duration-500">
                            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover:rotate-6 transition-all">
                                <MapIcon size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase italic">
                                    Project Monitoring
                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                                </h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                    <Activity size={12} className="text-blue-500" />
                                    Hệ thống giám sát vặn hành AI thời gian thực
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pointer-events-auto">
                            <div className="bg-white/70 backdrop-blur-xl px-8 py-5 rounded-[2rem] shadow-xl border border-white/50 flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-2xl">
                                    <Users className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Báo cáo</p>
                                    <p className="text-xl font-black text-slate-900 leading-none">{data?.reports.length || 0}</p>
                                </div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-xl px-8 py-5 rounded-[2rem] shadow-xl border border-white/50 flex items-center gap-4">
                                <div className="p-3 bg-red-50 rounded-2xl">
                                    <AlertTriangle className="text-red-500" size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cảnh báo</p>
                                    <p className="text-xl font-black text-red-600 leading-none">
                                        {data?.reports.filter(r => getDistance(r.lat, r.lng, r.project.lat, r.project.lng) > 300).length || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Container */}
                    <div ref={mapRef} className="w-full h-full" />

                    {/* Sidebar Panel Overlay */}
                    <div className="absolute right-8 top-44 bottom-10 w-80 z-10 hidden xl:flex flex-col gap-6 pointer-events-none">
                        <div className="bg-white/60 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/40 p-8 overflow-hidden flex flex-col flex-1 pointer-events-auto group hover:bg-white/80 transition-all duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <Navigation size={14} className="text-blue-600" />
                                    Live Reports
                                </h3>
                                <RefreshCw
                                    onClick={fetchData}
                                    className={`w-4 h-4 text-slate-400 cursor-pointer hover:text-blue-600 transition-colors ${loading ? 'animate-spin' : ''}`}
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                                {data?.reports.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 gap-4 opacity-50">
                                        <Info className="w-10 h-10 text-slate-300" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Không có báo cáo</span>
                                    </div>
                                ) : data?.reports.map(r => {
                                    const distance = getDistance(r.lat, r.lng, r.project.lat, r.project.lng)
                                    const isFraud = distance > 300
                                    return (
                                        <div
                                            key={r.id}
                                            className={`p-5 rounded-[2rem] border transition-all cursor-pointer hover:scale-[1.02] ${isFraud ? 'bg-red-50/50 border-red-100 hover:bg-red-50' : 'bg-white border-slate-100 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5'}`}
                                            onClick={() => leafletRef.current?.setView([r.lat, r.lng], 16)}
                                        >
                                            <div className="flex gap-4 mb-4">
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm flex-shrink-0">
                                                    <img src={r.photoUrl} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                    <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{r.workerName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(r.createdAt).toLocaleTimeString('vi-VN')}</p>
                                                </div>
                                            </div>
                                            <div className={`text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-2 px-3 py-1.5 rounded-full ${isFraud ? 'bg-red-500/10 text-red-600 border border-red-200/50' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-200/50'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isFraud ? 'bg-red-500 animate-pulse outline outline-4 outline-red-500/20' : 'bg-emerald-500'}`}></div>
                                                {isFraud ? `SAI VỊ TRÍ (${Math.round(distance)}M)` : 'Vị trí hợp lệ'}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Utility Overlay */}
                    <div className="absolute bottom-8 left-8 z-10 hidden md:flex items-center gap-4">
                        <button
                            onClick={fetchData}
                            className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-xl border border-white text-slate-900 hover:bg-white hover:scale-105 active:scale-95 transition-all"
                        >
                            <RefreshCw className={loading ? 'animate-spin' : ''} size={24} />
                        </button>
                        <button
                            className="bg-blue-600 p-5 rounded-4xl shadow-2xl shadow-blue-500/40 text-white hover:bg-blue-700 hover:scale-110 active:scale-90 transition-all"
                            onClick={() => {
                                if (data?.reports[0]) leafletRef.current?.setView([data.reports[0].lat, data.reports[0].lng], 12)
                            }}
                        >
                            <Crosshair size={24} />
                        </button>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-div-icon { background: none; border: none; }
                
                .project-marker { position: relative; }
                .marker-base { width: 32px; height: 32px; border-radius: 12px 12px 12px 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
                .marker-base svg { transform: rotate(45deg); }
                .marker-title { position: absolute; top: -30px; left: 50%; translate: -50%; background: white; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
                
                .worker-marker { position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
                .marker-avatar { position: relative; z-index: 10; width: 40px; height: 40px; background: white; border-radius: 14px; overflow: hidden; border: 3px solid white; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }
                .marker-avatar img { width: 100%; h-full; object-cover; }
                .marker-pulse { position: absolute; width: 100%; height: 100%; border-radius: 50%; opacity: 0; }
                
                .marker-fraud .marker-avatar { border-color: #ef4444; }
                .marker-fraud .marker-pulse { background: rgba(239, 68, 68, 0.4); animation: worker-ping 2s infinite; }
                .marker-valid .marker-avatar { border-color: #10b981; }
                .marker-valid .marker-pulse { background: rgba(16, 185, 129, 0.4); animation: worker-ping 3s infinite; }
                
                @keyframes worker-ping {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(2.5); opacity: 0; }
                }

                .premium-popup .leaflet-popup-content-wrapper { border-radius: 2rem; padding: 0; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
                .premium-popup .leaflet-popup-content { margin: 0; }
                
                .report-popup { width: 220px; }
                .report-popup .popup-header { padding: 20px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
                .report-popup .worker-name { font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 0; }
                .report-popup .time { font-size: 9px; font-weight: 600; color: #94a3b8; margin: 2px 0 0; }
                .report-popup .popup-image { padding: 15px; background: white; }
                .report-popup .popup-image img { width: 100%; height: 140px; object-fit: cover; border-radius: 1rem; }
                .report-popup .popup-status { padding: 0 15px 15px; background: white; }
                
                .status-badge { display: block; text-align: center; padding: 8px; border-radius: 10px; font-size: 9px; font-weight: 900; letter-spacing: 0.1em; }
                .badge-success { background: #ecfdf5; color: #059669; }
                .badge-error { background: #fef2f2; color: #dc2626; animation: badge-alert 1s infinite; }
                
                @keyframes badge-alert {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.03); }
                }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    )
}
