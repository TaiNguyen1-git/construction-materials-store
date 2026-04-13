'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
    title: string
    subtitle?: string
    align?: 'center' | 'left'
    badge?: string
    className?: string
}

export default function SectionHeader({ title, subtitle, align = 'center', badge, className }: SectionHeaderProps) {
    return (
        <div className={cn(
            "mb-16 flex flex-col gap-4",
            align === 'center' ? "items-center text-center" : "items-start text-left",
            className
        )}>
            {badge && (
                <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-blue-500/20"
                >
                    {badge}
                </motion.span>
            )}
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight"
            >
                {title}
            </motion.h2>
            {subtitle && (
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl leading-relaxed"
                >
                    {subtitle}
                </motion.p>
            )}
        </div>
    )
}
