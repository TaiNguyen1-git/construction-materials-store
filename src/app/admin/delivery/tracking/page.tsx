'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Truck, Map as MapIcon, Navigation, RefreshCw, Layers, PhoneCall, Package, Loader2, Info, ChevronRight, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
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
        id: string
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
        const validDeliveries = data.filter(d => d.currentLat !== 0 && d.currentLng !== 0 && d.currentLat && d.currentLng)
        const bounds: any[] = []

        validDeliveries.forEach(d => {
            const position: [number, number] = [d.currentLat, d.currentLng]
            bounds.push(position)

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

        // Auto-zoom map to fit all markers
        if (bounds.length > 0) {
            leafletRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
        }
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
        <div className="relative w-full h-[calc(100vh-140px)] min-h-[650px] bg-slate-50 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-slate-200 animate-in fade-in duration-700">
            <Toaster position="top-right" />

            {/* Header Overlay */}
            <div className="absolute top-8 left-8 right-8 z-[1000] flex flex-col lg:flex-row justify-between items-start gap-4 pointer-events-none">
                <div className="bg-white/80 backdrop-blur-2xl p-5 rounded-[2.5rem] border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.08)] pointer-events-auto flex items-center gap-6 group hover:bg-white transition-all duration-500">
                    <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-500">
                        <Truck size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                TRUNG TÂM ĐIỀU VẬN
                            </h1>
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">Live</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                            <MapIcon size={12} className="text-blue-500" />
                            Giám sát hành trình thực tế
                        </p>
                    </div>

                    <div className="hidden md:block h-10 w-px bg-slate-100 mx-2" />

                    <div className="hidden md:flex gap-8">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tài xế</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{deliveries.length}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Trạng thái</p>
                            <p className="text-sm font-black text-emerald-600 leading-none">Hoạt động</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pointer-events-auto">
                    <button
                        onClick={fetchDeliveries}
                        className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white/40 text-slate-600 hover:bg-white hover:text-blue-600 transition-all shadow-xl group"
                    >
                        <RefreshCw className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} size={20} />
                    </button>
                    <button
                        onClick={toggleLayers}
                        className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white/40 text-slate-600 hover:bg-white hover:text-blue-600 transition-all shadow-xl"
                    >
                        <Layers size={20} />
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <div ref={mapRef} className="w-full h-full" />

            {/* Left Sidebar Overlay */}
            <div className="absolute left-8 top-44 bottom-12 w-80 z-[1000] hidden xl:flex flex-col gap-6 pointer-events-none">
                <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 p-6 flex flex-col flex-1 pointer-events-auto shadow-[0_30px_60px_rgba(0,0,0,0.1)] min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-6 px-2 shrink-0">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <Navigation size={12} className="text-blue-500" />
                            Đang vận chuyển ({deliveries.length})
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar min-h-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Đang cập nhật...</span>
                            </div>
                        ) : deliveries.length === 0 ? (
                            <div className="p-6 text-center rounded-[1.5rem] bg-slate-50 border border-slate-100 border-dashed m-1">
                                <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-slate-400">Không có đơn hàng</p>
                            </div>
                        ) : deliveries.map(d => (
                            <div
                                key={d.id}
                                className="bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 p-3.5 rounded-2xl transition-all cursor-pointer group relative overflow-hidden shrink-0"
                                onClick={() => {
                                    if (d.currentLat !== 0 && d.currentLng !== 0) {
                                        leafletRef.current?.setView([d.currentLat, d.currentLng], 15)
                                    } else {
                                        toast.error('Chưa có tín hiệu GPS cho đơn này')
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-1 mb-1.5">
                                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm w-fit border ${d.order?.driver?.user?.name ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
                                                {d.order?.driver?.user?.name ? `TÀI XẾ: ${d.order.driver.user.name.toUpperCase()}` : 'CHƯA GÁN TÀI XẾ'}
                                            </span>
                                            {d.order?.orderNumber && (
                                                <Link
                                                    href={`/admin/orders/${d.order.id}`}
                                                    className="text-[11px] font-black text-slate-900 group-hover:text-blue-600 transition-colors block truncate"
                                                    title={d.order.orderNumber}
                                                >
                                                    #{d.order.orderNumber}
                                                </Link>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 line-clamp-1 leading-tight mb-2">
                                            {formatAddress(d.order?.shippingAddress)}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                                <Clock size={8} className="text-blue-500" />
                                                {new Date(d.lastLocationUpdate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter border ${d.status === 'SHIPPED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {d.status === 'SHIPPED' ? 'Đang giao' : 'Đã điều phối'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCallDriver(d);
                                        }}
                                        className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-500 transition-all shadow-sm flex-shrink-0"
                                    >
                                        <PhoneCall size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-5 bg-slate-900 rounded-[1.5rem] shadow-xl shadow-slate-900/10 flex items-center justify-between text-white group cursor-pointer active:scale-95 transition-all shrink-0"
                        onClick={() => window.location.href = '/admin/store-operations'}
                    >
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-0.5">Hệ thống</p>
                            <p className="text-xs font-black">Xem tất cả</p>
                        </div>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Bottom Info Bar Overlay */}
            <div className="absolute bottom-6 right-12 left-[23rem] z-[1000] hidden xl:flex">
                <div className="bg-white/80 backdrop-blur-2xl px-8 py-4 rounded-2xl border border-white/40 flex-1 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vệ tinh: Hoạt động</span>
                        </div>
                        <div className="w-px h-4 bg-slate-100"></div>
                        <div className="flex items-center gap-2.5">
                            <RefreshCw size={12} className="text-blue-500 animate-spin-slow" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cập nhật mỗi 15s</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Giao thức bảo mật SSL</p>
                        <div className="px-3 py-1 bg-slate-100/50 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                            Build v4.2.1
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

                .custom-leaflet-popup .leaflet-popup-content-wrapper { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(15px); color: #0f172a; border-radius: 1.25rem; border: 1px solid white; padding: 0; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .custom-leaflet-popup .leaflet-popup-content { margin: 0; }
                .custom-leaflet-popup .leaflet-popup-tip { background: white; }
                
                .popup-wrapper { padding: 16px; width: 220px; }
                .popup-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
                .popup-header .tag { background: #2563eb; font-size: 7px; font-weight: 900; padding: 1.5px 5px; border-radius: 3px; letter-spacing: 0.1em; color: white; }
                .popup-header .order-id { font-size: 11px; font-weight: 900; color: #1e293b; }
                .popup-body .label { font-size: 7px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px; }
                .popup-body .address { font-size: 10px; font-weight: 600; line-height: 1.4; color: #475569; margin-bottom: 12px; }
                .popup-body .status-row { display: flex; align-items: center; gap: 6px; background: #f8fafc; padding: 6px 10px; border-radius: 8px; }
                .popup-body .status-dot { width: 5px; height: 5px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 8px #3b82f6; }
                .popup-body .status-text { font-size: 8px; font-weight: 900; text-transform: uppercase; color: #3b82f6; }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
                
                .animate-spin-slow { animation: spin 8s linear infinite; }
            `}</style>
        </div>
    )
}
