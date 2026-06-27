import { AlertTriangle } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'
import { usePlanModalStore } from '../stores/planModal'

/**
 * Shown to paid customers (not trial — TrialBanner covers that case) when
 * they cross 80% / 100% of their monthly event quota. Hidden for tenants
 * comfortably under quota.
 */
export function QuotaBanner() {
    const { isPaid, usage, limits } = usePlan()
    const openUpgrade = usePlanModalStore(s => s.openModal)
    if (!isPaid || !usage || !limits) return null
    if (usage.eventsQuota <= 0) return null

    const pct = usage.eventsUsed / usage.eventsQuota
    if (pct < 0.8) return null   // Don't show until 80%

    const overQuota = pct >= 1.0
    const colour = overQuota
        ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
        : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'

    const headline = overQuota
        ? limits.overageBillable
            ? `You're past quota — ${usage.overageEvents.toLocaleString()} overage events being billed at $0.50 / 1k.`
            : `Quota exceeded — new events are being rejected.`
        : `${(pct * 100).toFixed(0)}% of your monthly quota used.`

    return (
        <div className={`border-b px-4 py-2 text-xs ${colour}`}>
            <div className="flex items-center justify-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="font-medium">{headline}</span>
                <span className="opacity-70">· {usage.eventsUsed.toLocaleString()} / {usage.eventsQuota.toLocaleString()}</span>
                <button
                    type="button"
                    onClick={() => openUpgrade()}
                    className="ml-6 rounded bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-500"
                >
                    Upgrade
                </button>
            </div>
        </div>
    )
}
