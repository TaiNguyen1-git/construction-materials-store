'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Truck, Map as MapIcon, Navigation, RefreshCw, Layers, PhoneCall, Package, Loader2, Info, ChevronRight, MapPin, Clock } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface ShippingAddress {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
}

interface Delivery {
    id: string
    orderNumber: string
    status: string
    currentLat: number
    currentLng: number
    lastLocationUpdate: string
    order: {
        orderNumber: string
        totalAmount: number
        shippingAddress: string | ShippingAddress | any | null
        driver?: {
            user: {
                name: string
                phone: string
            }
        }
    }
}

export default function AdminDeliveryTrackingPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([])
    const [loading, setLoading] = useState(true)
    const mapRef = useRef<HTMLDivElement>(null)
    const leafletRef = useRef<any>(null) // Leaflet Map instance
    const markersRef = useRef<Record<string, any>>({})

    const fetchDeliveries = async () => {
        try {
            const res = await fetch('/api/admin/delivery/tracking')
            const result = await res.json()
            if (result.success) {
                setDeliveries(result.data)
                updateMarkers(result.data)
            }
        } catch (error) {
            console.error('Fetch deliveries error:', error)
            toast.error('Lỗi tải vị trí tài xế')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDeliveries()
        const interval = setInterval(fetchDeliveries, 15000) // Poll every 15s
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!loading && typeof window !== 'undefined') {
            loadLeaflet()
        }
    }, [loading])

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

        const map = L.map(mapRef.current, {
            zoomControl: false,
            scrollWheelZoom: true
        }).setView([10.9482, 106.8223], 12)

        // Light theme map
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map)

        L.control.zoom({ position: 'bottomright' }).addTo(map)

        leafletRef.current = map
        updateMarkers(deliveries)
    }

    const formatAddress = (address: any): string => {
        if (!address) return 'N/A'
        if (typeof address === 'string') return address
        if (typeof address === 'object') {
            const parts = [
                address.street || address.address,
                address.ward,
                address.district,
                address.city || address.province
            ].filter(Boolean)
            return parts.length > 0 ? parts.join(', ') : 'Địa chỉ lỗi'
        }
        return 'N/A'
    }

    const updateMarkers = (data: Delivery[]) => {
        const L = (window as any).L
        if (!L || !leafletRef.current) return

        // Remove old markers that are no longer in the data
        const currentIds = data.map(d => d.id)
        Object.keys(markersRef.current).forEach(id => {
            if (!currentIds.includes(id)) {
                leafletRef.current.removeLayer(markersRef.current[id])
                delete markersRef.current[id]
            }
        })

        // Add or update markers
        data.forEach(d => {
            const position: [number, number] = [d.currentLat, d.currentLng]

            if (markersRef.current[d.id]) {
                markersRef.current[d.id].setLatLng(position)
            } else {
                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class="marker-container">
                                <div class="marker-pulse"></div>
                                <div class="marker-main">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                                </div>
                                <div class="marker-label">#${d.order.orderNumber}</div>
                           </div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                })

                markersRef.current[d.id] = L.marker(position, { icon })
                    .addTo(leafletRef.current)
                    .bindPopup(`
                        <div class="popup-wrapper">
                            <div class="popup-header">
                                <span class="tag">VẬN CHUYỂN</span>
                                <span class="order-id">#${d.order?.orderNumber || 'N/A'}</span>
                            </div>
                            <div class="popup-body">
                                <p class="label">Địa chỉ giao</p>
                                <p class="address">${formatAddress(d.order?.shippingAddress)}</p>
                                <div class="status-row">
                                    <span class="status-dot"></span>
                                    <span class="status-text">${d.status}</span>
                                </div>
                            </div>
                        </div>
                    `, {
                        className: 'custom-leaflet-popup',
                        offset: [0, -10]
                    })
            }
        })
    }

    const handleCallDriver = (delivery: Delivery) => {
        const phone = delivery.order.driver?.user?.phone
        if (phone) {
            window.location.href = `tel:${phone}`
            toast.success(`Đang mở ứng dụng gọi đến tài xế ${delivery.order.driver?.user?.name || ''}`)
        } else {
            toast.error('Tài xế chưa cập nhật số điện thoại')
        }
    }

    const toggleLayers = () => {
        toast.success('Đã chuyển đổi lớp bản đồ')
    }

    return (
        <div className="relative w-full h-[calc(100vh-140px)] min-h-[650px] bg-slate-900 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 animate-in fade-in duration-700">
            <Toaster position="top-right" />

            {/* Header Overlay */}
            <div className="absolute top-8 left-8 right-8 z-[1000] flex flex-col lg:flex-row justify-between items-start gap-4 pointer-events-none">
                <div className="bg-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl pointer-events-auto flex items-center gap-6 group hover:bg-slate-900/60 transition-all duration-500">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/30 group-hover:scale-105 transition-transform duration-500">
                        <Truck size={32} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-white tracking-widest uppercase italic">
                                Giám sát Vận tải
                            </h1>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Trực tiếp</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                            <MapIcon size={12} className="text-blue-500" />
                            Hệ thống giám sát vặn tải thời gian thực
                        </p>
                    </div>

                    <div className="hidden md:block h-12 w-px bg-white/10 mx-4" />

                    <div className="hidden md:flex gap-10">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Đang chạy</p>
                            <p className="text-2xl font-black text-white tracking-tighter">{deliveries.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Khu vực</p>
                            <p className="text-2xl font-black text-white tracking-tighter">Biên Hòa</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pointer-events-auto">
                    <button
                        onClick={fetchDeliveries}
                        title="Tải lại dữ liệu"
                        className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/10 text-white/70 hover:bg-slate-900 hover:text-white transition-all shadow-xl group border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"
                    >
                        <RefreshCw className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} size={24} />
                    </button>
                    <button
                        onClick={toggleLayers}
                        title="Đổi lớp bản đồ"
                        className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-3xl border border-white/10 text-white/70 hover:bg-slate-900 hover:text-white transition-all shadow-xl border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"
                    >
                        <Layers size={24} />
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <div ref={mapRef} className="w-full h-full" />

            {/* Left Sidebar Overlay */}
            <div className="absolute left-8 top-44 bottom-12 w-80 z-[1000] hidden xl:flex flex-col gap-6 pointer-events-none">
                <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-8 flex flex-col flex-1 pointer-events-auto shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Navigation size={14} className="text-blue-500" />
                            Đội ngũ Tài xế
                        </h3>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse outline outline-4 outline-blue-500/20"></div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-4">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đang kết nối vệ tinh...</span>
                            </div>
                        ) : deliveries.length === 0 ? (
                            <div className="p-10 text-center rounded-3xl bg-white/5 border border-white/5 border-dashed">
                                <Info className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                                <p className="text-xs font-bold text-slate-500">Chưa có vận đơn trực tuyến</p>
                            </div>
                        ) : deliveries.map(d => (
                            <div
                                key={d.id}
                                className="bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 p-5 rounded-[2rem] transition-all cursor-pointer group relative overflow-hidden"
                                onClick={() => leafletRef.current?.setView([d.currentLat, d.currentLng], 15)}
                            >
                                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic">Tài xế: {d.order?.driver?.user?.name || 'Chưa rõ'}</span>
                                            <span className="text-xs font-black text-white">• Đơn #${d.order?.orderNumber || 'N/A'}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">
                                            {formatAddress(d.order?.shippingAddress).slice(0, 24)}...
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCallDriver(d);
                                        }}
                                        className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-blue-600 transition-all shadow-sm"
                                    >
                                        <PhoneCall size={16} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest relative z-10">
                                    <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                                        <Clock size={12} className="text-blue-500" />
                                        {new Date(d.lastLocationUpdate).toLocaleTimeString('vi-VN')}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-blue-500/20 px-2 py-1 rounded-md text-blue-400">
                                        <Package size={12} />
                                        {d.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] flex items-center justify-between text-white group cursor-pointer active:scale-95 transition-all"
                        onClick={() => window.location.href = '/admin/orders'}
                    >
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Trung tâm Điều hành</p>
                            <p className="text-sm font-black">Xem tất cả vận đơn</p>
                        </div>
                        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Info Bar Overlay */}
            <div className="absolute bottom-8 right-16 left-[23rem] z-[1000] hidden xl:flex">
                <div className="bg-slate-900/40 backdrop-blur-2xl px-10 py-6 rounded-[2rem] border border-white/10 flex-1 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Tín hiệu vệ tinh: Tốt</span>
                        </div>
                        <div className="w-px h-6 bg-white/10"></div>
                        <div className="flex items-center gap-3">
                            <RefreshCw size={14} className="text-blue-500 animate-spin-slow" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Tự động cập nhật mỗi 15s</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Giao thức: Bảo mật HTTPS</p>
                        <div className="px-5 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black text-blue-400 tracking-widest uppercase">
                            SmartBuild v4.2
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-div-icon { background: none; border: none; }
                .marker-container { position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
                .marker-pulse { position: absolute; width: 100%; height: 100%; background: rgba(59, 130, 246, 0.4); border-radius: 50%; animation: marker-ping 2s infinite; }
                .marker-main { position: relative; z-index: 10; width: 36px; height: 36px; background: #2563eb; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 10px 25px rgba(0,0,0,0.5); transform: rotate(45deg); transition: transform 0.3s; }
                .marker-main svg { transform: rotate(-45deg); }
                .marker-container:hover .marker-main { transform: rotate(45deg) scale(1.1); background: #1d4ed8; }
                .marker-label { position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 900; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.3); opacity: 0.8; }
                
                @keyframes marker-ping {
                    0% { transform: scale(0.5); opacity: 0.8; }
                    100% { transform: scale(3); opacity: 0; }
                }

                .custom-leaflet-popup .leaflet-popup-content-wrapper { background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(20px); color: white; border-radius: 1.5rem; border: 1px solid rgba(255,255,255,0.1); padding: 0; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
                .custom-leaflet-popup .leaflet-popup-content { margin: 0; }
                .custom-leaflet-popup .leaflet-popup-tip { background: rgba(15, 23, 42, 0.9); }
                
                .popup-wrapper { padding: 20px; width: 240px; }
                .popup-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; }
                .popup-header .tag { background: #2563eb; font-size: 8px; font-weight: 900; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.1em; color: white; }
                .popup-header .order-id { font-size: 12px; font-weight: 900; color: white; }
                .popup-body .label { font-size: 8px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 4px; }
                .popup-body .address { font-size: 11px; font-weight: 600; line-height: 1.5; color: #e2e8f0; margin-bottom: 15px; }
                .popup-body .status-row { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 12px; }
                .popup-body .status-dot { width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 10px #3b82f6; }
                .popup-body .status-text { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #3b82f6; }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                
                .animate-spin-slow { animation: spin 8s linear infinite; }
            `}</style>
        </div>
    )
}
