'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface Partner {
    name: string
    logo?: string
    color: string
    text: string
}

interface FeaturedBrandsProps {
    partners: Partner[]
}

export default function FeaturedBrands({ partners }: FeaturedBrandsProps) {
    const [loadedLogos, setLoadedLogos] = useState<Set<string>>(new Set())
    const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set())

    return (
        <section className="py-24 bg-white border-t border-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-[11px] font-black text-slate-400 underline underline-offset-[12px] decoration-indigo-500 uppercase tracking-[0.4em] mb-16">
                    Đối tác cung ứng vật liệu chiến lược
                </p>

                <div className="relative">
                    {/* Gradients to mask the scrolling edges */}
                    <div className="absolute top-0 left-0 bottom-0 w-40 bg-gradient-to-r from-white to-transparent z-10"></div>
                    <div className="absolute top-0 right-0 bottom-0 w-40 bg-gradient-to-l from-white to-transparent z-10"></div>

                    <div className="flex gap-12 logo-scroller-premium">
                        {[...partners, ...partners].map((p, i) => {
                            const key = `partner-${i}`
                            const isLoaded = loadedLogos.has(key)
                            const hasFailed = failedLogos.has(key)

                            return (
                                <div
                                    key={key}
                                    className={`flex-shrink-0 flex items-center justify-center min-w-[200px] h-24 px-8 rounded-3xl transition-all hover:scale-105 duration-500 cursor-pointer ${p.color} border border-transparent hover:border-slate-100 group relative grayscale hover:grayscale-0 opacity-60 hover:opacity-100`}
                                >
                                    <span className={`absolute inset-0 flex items-center justify-center font-black text-sm tracking-tighter ${p.text} whitespace-nowrap uppercase transition-opacity duration-500 ${(isLoaded && !hasFailed) ? 'opacity-0' : 'opacity-100'}`}>
                                        {p.name}
                                    </span>

                                    {p.logo && !hasFailed && (
                                        <Image
                                            src={p.logo}
                                            alt={p.name}
                                            width={160}
                                            height={40}
                                            className={`relative z-10 h-10 object-contain transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                                            onLoad={() => setLoadedLogos(prev => new Set(prev).add(key))}
                                            onError={() => setFailedLogos(prev => new Set(prev).add(key))}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .logo-scroller-premium {
          display: flex;
          width: fit-content;
          animation: logo-scroll 40s linear infinite;
        }
        @keyframes logo-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .logo-scroller-premium:hover {
          animation-play-state: paused;
        }
      `}</style>
        </section>
    )
}
