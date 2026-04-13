'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
    children: React.ReactNode
    className?: string
    hoverScale?: boolean
    onClick?: () => void
}

export default function GlassCard({ children, className, hoverScale = true, onClick }: GlassCardProps) {
    return (
        <motion.div
            whileHover={hoverScale ? { y: -8, scale: 1.01 } : {}}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClick}
            className={cn(
                "bg-white/80 backdrop-blur-xl border border-white/40 rounded-[40px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/5 overflow-hidden",
                onClick && "cursor-pointer",
                className
            )}
        >
            {children}
        </motion.div>
    )
}
