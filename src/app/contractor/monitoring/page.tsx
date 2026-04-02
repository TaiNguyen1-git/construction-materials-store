'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Map as MapIcon, Users, AlertTriangle, Crosshair, RefreshCw, Navigation, Loader2, Info, ChevronRight, Activity } from 'lucide-react'
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
    const [data, setData] = useState<{ projects: Project[], reports: WorkerReport[] } | null>(null)
    const [loading, setLoading] = useState(true)
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
            toast.error('Lỗi kết nối dữ liệu giám sát thời gian thực')
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
        <div className="h-[calc(100vh-140px)] flex flex-col font-sans overflow-hidden animate-in fade-in duration-1000">
            <Toaster position="top-right" />
            <div className="flex-1 relative flex flex-col rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-100 bg-slate-50 shadow-blue-100">
                {/* Header Overlay */}
                <div className="absolute top-10 left-10 right-10 z-10 flex flex-col lg:flex-row gap-6 pointer-events-none">
                    <div className="bg-white/70 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl border border-white/50 pointer-events-auto flex items-center gap-8 group hover:bg-white/90 transition-all duration-700">
                        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 group-hover:rotate-12 transition-all">
                            <MapIcon size={32} />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4 uppercase italic">
                                Giám sát thi công
                                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
                            </h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                                <Activity size={14} className="text-blue-500" />
                                Hệ thống tọa độ & Vận hành AI thời gian thực
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 pointer-events-auto">
                        <div className="bg-white/70 backdrop-blur-2xl px-10 py-6 rounded-[2.2rem] shadow-xl border border-white/50 flex items-center gap-5">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                <Users className="text-blue-600" size={24} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Báo cáo thợ</p>
                                <p className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none">{data?.reports.length || 0}</p>
                            </div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-2xl px-10 py-6 rounded-[2.2rem] shadow-xl border border-white/50 flex items-center gap-5">
                            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                                <AlertTriangle className="text-rose-600" size={24} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Vi phạm tọa độ</p>
                                <p className="text-2xl font-black text-rose-600 italic tracking-tighter leading-none">
                                    {data?.reports.filter(r => getDistance(r.lat, r.lng, r.project.lat, r.project.lng) > 300).length || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Container */}
                <div ref={mapRef} className="w-full h-full" />

                {/* Sidebar Panel Overlay */}
                <div className="absolute right-10 top-48 bottom-10 w-96 z-10 hidden xl:flex flex-col gap-8 pointer-events-none">
                    <div className="bg-white/60 backdrop-blur-3xl rounded-[3.5rem] shadow-2xl border border-white/40 p-10 overflow-hidden flex flex-col flex-1 pointer-events-auto group hover:bg-white/80 transition-all duration-700">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4 italic">
                                <Navigation size={18} className="text-blue-600" />
                                Nhật ký hiện trường
                            </h3>
                            <button 
                                onClick={fetchData}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-blue-600 hover:text-white transition-all shadow-sm group/ref"
                            >
                                <RefreshCw
                                    className={`w-5 h-5 text-slate-400 group-hover/ref:text-white transition-colors ${loading ? 'animate-spin' : ''}`}
                                />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                            {data?.reports.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-60 gap-6 opacity-30">
                                    <Info className="w-16 h-16 text-slate-300" />
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] italic">Không có dữ liệu</span>
                                </div>
                            ) : data?.reports.map(r => {
                                const distance = getDistance(r.lat, r.lng, r.project.lat, r.project.lng)
                                const isFraud = distance > 300
                                return (
                                    <div
                                        key={r.id}
                                        className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer hover:scale-[1.03] active:scale-95 ${isFraud ? 'bg-rose-50/50 border-rose-100 hover:bg-rose-100/50' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100'}`}
                                        onClick={() => {
                                            toast.success(`Đang nhắm tọa độ: ${r.workerName}`, { duration: 1000 });
                                            leafletRef.current?.setView([r.lat, r.lng], 16);
                                        }}
                                    >
                                        <div className="flex gap-5 mb-5">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border-4 border-white shadow-lg flex-shrink-0">
                                                <img src={r.photoUrl} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
                                                <p className="text-base font-black text-slate-900 truncate uppercase tracking-tighter italic">{r.workerName}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{new Date(r.createdAt).toLocaleTimeString('vi-VN')}</p>
                                            </div>
                                        </div>
                                        <div className={`text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 px-5 py-3 rounded-2xl italic leading-none border ${isFraud ? 'bg-rose-600 text-white border-rose-600 shadow-xl shadow-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm'}`}>
                                            {!isFraud && <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                                            {isFraud ? `SAI LỆCH TỌA ĐỘ (${Math.round(distance)}M)` : 'VỊ TRÍ HỢP LỆ'}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom Utility Overlay */}
                <div className="absolute bottom-10 left-10 z-10 hidden md:flex items-center gap-6">
                    <button
                        onClick={fetchData}
                        className="bg-white/90 backdrop-blur-2xl w-16 h-16 rounded-[1.8rem] shadow-2xl border border-white text-slate-900 hover:bg-blue-600 hover:text-white hover:scale-110 active:scale-90 transition-all flex items-center justify-center group"
                    >
                        <RefreshCw className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} size={28} />
                    </button>
                    <button
                        className="bg-blue-600 w-16 h-16 rounded-[2rem] shadow-2xl shadow-blue-500/40 text-white hover:bg-blue-700 hover:scale-110 active:scale-90 transition-all flex items-center justify-center group"
                        onClick={() => {
                            toast.success('Đang tái định vị trung tâm...', { duration: 1000 });
                            if (data?.reports[0]) leafletRef.current?.setView([data.reports[0].lat, data.reports[0].lng], 12)
                        }}
                    >
                        <Crosshair size={28} className="group-hover:scale-125 transition-transform" />
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .custom-div-icon { background: none; border: none; }
                
                .project-marker { position: relative; }
                .marker-base { width: 32px; height: 32px; border-radius: 12px 12px 12px 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
                .marker-base svg { transform: rotate(45deg); }
                .marker-title { position: absolute; top: -30px; left: 50%; translate: -50%; background: white; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
                
                .worker-marker { position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
                .marker-avatar { position: relative; z-index: 10; width: 40px; height: 40px; background: white; border-radius: 14px; overflow: hidden; border: 3px solid white; box-shadow: 0 15px 35px rgba(0,0,0,0.3); }
                .marker-avatar img { width: 100%; height: 100%; object-fit: cover; }
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
