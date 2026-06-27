import { useState } from 'react'
import { Clock, X } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'
import { usePlanModalStore } from '../stores/planModal'

// Per-day dismissal — once a user clicks X, the banner stays hidden until
// the calendar day rolls over. This keeps urgency reasserting itself as
// the trial countdown ticks down without nagging them mid-session.
const DISMISSAL_KEY = 'dp:trial_banner_dismissed_on'

function isDismissedToday(): boolean {
    try {
        const stored = localStorage.getItem(DISMISSAL_KEY)
        if (!stored) return false
        return new Date(stored).toDateString() === new Date().toDateString()
    } catch { return false }
}

function dismissForToday(): void {
    try { localStorage.setItem(DISMISSAL_KEY, new Date().toISOString()) } catch { /* ignore */ }
}

/**
 * Persistent banner shown to trial users only. Hides for paid tiers,
 * Internal accounts, and any other non-trial state.
 *
 * Three visual states based on days remaining:
 *   - 8+ days left:  neutral slate
 *   - 1–7 days left: amber
 *   - 0 days (in grace): red
 */
export function TrialBanner() {
    const { isTrial, trialDaysLeft, usage, plan, limits } = usePlan()
    const openUpgrade = usePlanModalStore(s => s.openModal)
    const [dismissed, setDismissed] = useState(isDismissedToday)

    if (!isTrial || trialDaysLeft === null) return null
    if (dismissed) return null

    // Quiet trial through most of the period — show the banner only in two
    // moments where the customer actually needs to act:
    //   1. Final 5-day warning window before expiry
    //   2. After trial expiry — account is in read-only lifecycle state
    const isReadOnly     = plan?.lifecycleState === 'readonly'
    const isFinalWarning = trialDaysLeft > 0 && trialDaysLeft <= 5
    if (!isFinalWarning && !isReadOnly) return null

    // How long until the account moves from readonly → suspended
    let daysUntilSuspension: number | null = null
    if (isReadOnly && plan?.lifecycleChangedAt && limits) {
        const enteredReadonlyMs = new Date(plan.lifecycleChangedAt).getTime()
        const suspendsAtMs      = enteredReadonlyMs + (limits.readonlyDays * 86_400_000)
        daysUntilSuspension     = Math.max(0, Math.ceil((suspendsAtMs - Date.now()) / 86_400_000))
    }

    const headline = isReadOnly
        ? 'Your trial has ended — account is now read-only. Upgrade to make changes.'
        : trialDaysLeft === 1
            ? 'Your trial ends tomorrow.'
            : `${trialDaysLeft} days left in your free trial.`

    // Secondary line: in readonly we show "suspended in X days" — usage is
    // no longer relevant (account can't ingest more events anyway). During
    // the final 5-day warning we show the event counter for context.
    const secondaryLine = isReadOnly
        ? (daysUntilSuspension !== null
            ? (daysUntilSuspension === 0
                ? 'Account will be suspended today'
                : daysUntilSuspension === 1
                    ? 'Account will be suspended tomorrow'
                    : `Account will be suspended in ${daysUntilSuspension} days`)
            : null)
        : (usage
            ? `${usage.eventsUsed.toLocaleString()} / ${usage.eventsQuota.toLocaleString()} events used`
            : null)

    function handleDismiss() {
        dismissForToday()
        setDismissed(true)
    }

    return (
        <div className="relative border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-100">
            {/* Centered single-line content */}
            <div className="flex items-center justify-center gap-2">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                <span className="font-medium">{headline}</span>
                {secondaryLine && (
                    <span className="text-zinc-400">· {secondaryLine}</span>
                )}
                <button
                    type="button"
                    onClick={() => openUpgrade()}
                    className="ml-6 rounded bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-500"
                >
                    Upgrade now
                </button>
            </div>

            {/* X dismiss — absolute right so it doesn't pull the centered content off-axis */}
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss banner"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-100"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}
