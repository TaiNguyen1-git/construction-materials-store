'use client'

import { useAuth } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'
import TwoFactorOnboardingModal from './TwoFactorOnboardingModal'

export default function GlobalAuthModals() {
    const { needs2FASetupPrompt, dismiss2FAPrompt, isLoading } = useAuth()
    const pathname = usePathname()

    // Don't show modal on login page or while auth is still loading
    const shouldShow = needs2FASetupPrompt && !isLoading && pathname !== '/login'

    return (
        <>
            <TwoFactorOnboardingModal
                isOpen={shouldShow}
                onClose={dismiss2FAPrompt}
                onConfirm={dismiss2FAPrompt} // Confirm also dismisses it, redirect handled in modal
            />
        </>
    )
}
