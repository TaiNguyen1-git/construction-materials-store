'use client'

import { useState, useEffect } from 'react'

export default function ReadingProgressBar() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight
            const currentProgress = (window.scrollY / totalHeight) * 100
            setProgress(currentProgress)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div 
            className="fixed top-0 left-0 h-1.5 bg-primary-600 z-[100] transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
            style={{ width: `${progress}%` }}
        />
    )
}
