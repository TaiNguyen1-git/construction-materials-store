'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

interface Banner {
    image: string
    tag: string
    title: string
    sub: string
    link?: string
}

interface BannerCarouselProps {
    banners: Banner[]
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        if (banners.length <= 1) return
        const interval = setInterval(() => {
            setCurrent(prev => (prev + 1) % banners.length)
        }, 6000)
        return () => clearInterval(interval)
    }, [banners.length])

    if (banners.length === 0) return null

    return (
        <div className="relative h-[450px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-50 group">
            {banners.map((banner, idx) => (
                <div
                    key={idx}
                    className={`absolute inset-0 transition-all duration-1000 ease-out ${idx === current ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'}`}
                >
                    <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        sizes="(max-width: 1200px) 100vw, 800px"
                        className="object-cover transition-transform duration-[10000ms] hover:scale-110"
                        priority={idx === 0}
                    />

                    {/* Advanced Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent flex flex-col justify-end p-12 text-white">
                        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <span className="inline-block bg-indigo-600 text-[10px] font-black px-4 py-1.5 rounded-full mb-6 tracking-[0.2em] shadow-lg shadow-indigo-600/20 uppercase">
                                {banner.tag}
                            </span>
                            <h3 className="text-4xl md:text-5xl font-black mb-4 uppercase italic tracking-tighter leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-blue-200 pr-8">
                                {banner.title}
                            </h3>
                            <p className="text-white/80 text-lg font-medium leading-relaxed max-w-sm">
                                {banner.sub}
                            </p>
                        </div>
                    </div>
                </div>
            ))}

            {/* Progress Indicators */}
            <div className="absolute bottom-8 right-12 flex gap-3 z-30">
                {banners.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className="group relative h-1.5 transition-all duration-500 rounded-full bg-white/20 hover:bg-white/40 overflow-hidden"
                        style={{ width: idx === current ? '60px' : '15px' }}
                    >
                        {idx === current && (
                            <div
                                className="absolute inset-0 bg-indigo-500 animate-[progress_6s_linear]"
                                style={{ width: '100%' }}
                            />
                        )}
                    </button>
                ))}
            </div>

            <style jsx>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
      `}</style>
        </div>
    )
}
