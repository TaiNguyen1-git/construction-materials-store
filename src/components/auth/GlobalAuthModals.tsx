'use client'

import { useAuth } from '@/contexts/auth-context'
import TwoFactorOnboardingModal from './TwoFactorOnboardingModal'

export default function GlobalAuthModals() {
    const { needs2FASetupPrompt, dismiss2FAPrompt } = useAuth()

    return (
        <>
            <TwoFactorOnboardingModal
                isOpen={needs2FASetupPrompt}
                onClose={dismiss2FAPrompt}
                onConfirm={dismiss2FAPrompt} // Confirm also dismisses it, redirect handled in modal
            />
        </>
    )
}
