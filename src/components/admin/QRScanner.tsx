'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Camera, RefreshCw, Loader2, Zap, Monitor } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface QRScannerProps {
    onScan: (data: string) => void
    onClose: () => void
    title?: string
}

export default function QRScanner({ onScan, onClose, title = 'Quét mã QR / Barcode' }: QRScannerProps) {
    const [loading, setLoading] = useState(true)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [torch, setTorch] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        // In a real browser environment, we use navigator.mediaDevices.getUserMedia
        startCamera()
        return () => stopCamera()
    }, [])

    const startCamera = async () => {
        setLoading(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setHasPermission(true)
            }
        } catch (err) {
            console.error('Camera Error:', err)
            setHasPermission(false)
            toast.error('Không thể truy cập Camera. Vui lòng cấp quyền.')
        } finally {
            setLoading(false)
        }
    }

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach(track => track.stop())
        }
    }

    // Mock scan for Demo (Simulation)
    const simulateScan = (mockData: string) => {
        toast.success('Đã nhận diện mã: ' + mockData)
        onScan(mockData)
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                            <Zap className="text-yellow-400" size={20} />
                            {title}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Căn chỉnh mã vào khung hình</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="relative aspect-square bg-black overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Đang khởi tạo camera...</p>
                        </div>
                    )}

                    {!loading && hasPermission === false && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-10 text-center gap-4">
                            <Monitor className="w-12 h-12 text-red-500" />
                            <p className="text-sm font-bold">Lỗi truy cập Camera</p>
                            <button onClick={startCamera} className="px-6 py-3 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Thử lại</button>
                        </div>
                    )}

                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                    />

                    {/* Scanning Overlay UI */}
                    <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                        <div className="w-full h-full border-2 border-blue-500/50 rounded-3xl relative">
                            {/* Corner Accents */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                            
                            {/* Scanning Line Animation */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-8 bg-slate-50 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <button 
                            onClick={() => setTorch(!torch)}
                            className={`p-4 rounded-2xl transition-all flex items-center gap-3 ${torch ? 'bg-yellow-100 text-yellow-600' : 'bg-white text-slate-400 border border-slate-100'}`}
                        >
                            <Zap size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Đèn Flash</span>
                        </button>
                        
                        <button 
                            onClick={startCamera}
                            className="p-4 bg-white text-slate-400 border border-slate-100 rounded-2xl hover:text-blue-600 hover:border-blue-200 transition-all"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>

                    {/* Demo Helper - Only for development/demo */}
                    <div className="border-t pt-4 border-slate-200">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Simulate Scan (Demo Mode):</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <button 
                                onClick={() => simulateScan('BIN-A1-01')}
                                className="whitespace-nowrap px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
                            >
                                Kệ A1-01
                            </button>
                            <button 
                                onClick={() => simulateScan('SKU-IRON-001')}
                                className="whitespace-nowrap px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
                            >
                                Thép Phi 10
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scan {
                    from { top: 0; }
                    to { top: 100%; }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
            `}</style>
        </div>
    )
}
