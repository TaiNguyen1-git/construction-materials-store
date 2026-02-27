'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Truck, Map as MapIcon, Navigation, RefreshCw, Layers, PhoneCall, Package } from 'lucide-react'
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
        shippingAddress: string | ShippingAddress | null
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

        const map = L.map(mapRef.current).setView([10.9482, 106.8223], 12)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map)

        leafletRef.current = map
        updateMarkers(deliveries)
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
                    html: `<div class="w-10 h-10 bg-blue-500 rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center text-white animate-bounce-slow">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                           </div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                })

                markersRef.current[d.id] = L.marker(position, { icon })
                    .addTo(leafletRef.current)
                    .bindPopup(`
                        <div class="p-3 w-56 font-sans">
                            <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                                <span class="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-black italic">DELIVERY</span>
                                <span class="text-xs font-black text-slate-900"># ${d.order.orderNumber}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Địa chỉ giao</p>
                            <p className="text-xs font-bold text-slate-800 leading-tight mb-3">
                                ${typeof d.order.shippingAddress === 'string'
                            ? d.order.shippingAddress
                            : d.order.shippingAddress
                                ? `${(d.order.shippingAddress as ShippingAddress).street || ''}, ${(d.order.shippingAddress as ShippingAddress).city || ''}`
                                : 'N/A'}
                            </p>
                            <div class="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                                <span class="text-[9px] font-black text-slate-400">STATUS</span>
                                <span class="text-[9px] font-black text-blue-600 uppercase tracking-widest">${d.status}</span>
                            </div>
                        </div>
                    `)
            }
        })
    }

    return (
        <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
            <Toaster position="top-right" />

            {/* Control Bar Overlay */}
            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/5 shadow-2xl pointer-events-auto flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                        <Truck size={30} className="italic" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 italic uppercase">
                            Hệ thống Giám sát Vặn tải
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Theo dõi tài xế thời gian thực qua Web-Link</p>
                    </div>

                    <div className="h-10 w-[1px] bg-white/10 mx-2" />

                    <div className="flex gap-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Đang chạy</p>
                            <p className="text-xl font-black text-white leading-none">{deliveries.length}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Khu vực</p>
                            <p className="text-xl font-black text-white leading-none">Biên Hòa</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pointer-events-auto">
                    <button className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-white hover:bg-slate-800 transition-all shadow-xl">
                        <Layers size={20} />
                    </button>
                    <button onClick={fetchDeliveries} className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-white hover:bg-slate-800 transition-all shadow-xl">
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                    </button>
                </div>
            </div>

            {/* Main Map */}
            <div ref={mapRef} className="flex-1 grayscale-[0.2]" />

            {/* Sidebar Active List Overlay */}
            <div className="absolute left-6 top-36 bottom-10 w-80 z-10 hidden lg:flex flex-col gap-4 pointer-events-none">
                <div className="bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 flex flex-1 flex-col pointer-events-auto">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Navigation size={14} className="text-blue-500" />
                        Tài xế đang hoạt động
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {deliveries.length === 0 ? (
                            <div className="py-10 text-center italic text-slate-500 text-xs">Chưa có vận đơn trực tuyến</div>
                        ) : deliveries.map(d => (
                            <div key={d.id} className="bg-white/5 border border-white/5 hover:bg-white/10 p-4 rounded-3xl transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 italic"># {d.order.orderNumber}</p>
                                        <p className="text-sm font-black text-white">
                                            {typeof d.order.shippingAddress === 'string'
                                                ? d.order.shippingAddress.slice(0, 20)
                                                : (d.order.shippingAddress as ShippingAddress)?.street?.slice(0, 20) || 'N/A'}...
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                                        <PhoneCall size={14} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><RefreshCw size={10} /> {new Date(d.lastLocationUpdate).toLocaleTimeString()}</span>
                                    <span className="flex items-center gap-1"><Package size={10} /> {d.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-div-icon { background: none; border: none; }
                .animate-bounce-slow { animation: bounce-slow 2s infinite; }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .leaflet-popup-content-wrapper { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); color: #000; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    )
}
