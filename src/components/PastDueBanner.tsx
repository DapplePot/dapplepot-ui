import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'
import { openCustomerPortal } from '../api/billing'

/**
 * Shown to paid customers whose latest renewal payment failed.
 *
 * Two signals together drive this banner:
 *   1. subscription.status === 'past_due'  — LS dunning is in progress
 *   2. lifecycle_state === 'readonly'      — server-side write block is on
 *
 * The banner persists indefinitely (no daily dismiss). The only way out is
 * to update the payment method — once LS retries succeed, the webhook flips
 * both signals back to active and the banner disappears.
 *
 * If LS eventually gives up (subscription_cancelled), this banner stops
 * showing because status changes from 'past_due' → 'cancelled'. A different
 * banner (or just the readonly state) takes over.
 */
export function PastDueBanner() {
    const { snapshot } = usePlan()
    const [openingPortal, setOpeningPortal] = useState(false)

    const subscription = snapshot?.subscription
    if (!subscription) return null
    if (subscription.status !== 'past_due') return null

    async function handleUpdatePayment() {
        try {
            setOpeningPortal(true)
            const { url } = await openCustomerPortal()
            window.location.href = url
        } catch (err) {
            setOpeningPortal(false)
            console.error('Failed to open customer portal:', err)
        }
    }

    return (
        <div className="relative border-b border-red-800 bg-red-900 px-4 py-2 text-xs text-red-50">
            <div className="flex items-center justify-center gap-3">
                <AlertTriangle className="h-3.5 w-3.5 text-red-200" />
                <span className="font-medium">
                    Payment failed — your account is read-only.
                </span>
                <span className="text-red-200">
                    · Update your payment method to restore access.
                </span>
                <button
                    type="button"
                    onClick={handleUpdatePayment}
                    disabled={openingPortal}
                    className="ml-6 rounded bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                    {openingPortal ? 'Opening…' : 'Update payment'}
                </button>
            </div>
        </div>
    )
}
