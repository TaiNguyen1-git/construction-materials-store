'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

const variants = {
    hidden: { opacity: 0, x: 0, y: 20 },
    enter: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: 0, y: -20 },
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial="hidden"
                animate="enter"
                exit="exit"
                variants={variants}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
