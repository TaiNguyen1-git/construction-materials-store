'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button, ButtonProps } from './button'
import { cn } from '@/lib/utils'

interface AnimatedButtonProps extends ButtonProps {
    glow?: boolean
    hoverScale?: boolean
}

export default function AnimatedButton({ 
    children, 
    className, 
    glow = false, 
    hoverScale = true,
    ...props 
}: AnimatedButtonProps) {
    return (
        <motion.div
            whileHover={hoverScale && !props.disabled ? { scale: 1.02 } : {}}
            whileTap={hoverScale && !props.disabled ? { scale: 0.98 } : {}}
            className={cn("relative group", className)}
        >
            {glow && !props.disabled && (
                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-gradient-xy" />
            )}
            <Button
                className={cn(
                    "relative w-full rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                    glow && "shadow-xl shadow-blue-500/20",
                    className
                )}
                {...props}
            >
                {children}
            </Button>
        </motion.div>
    )
}
