import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { usePlan } from '../hooks/usePlan'
import { usePlanModalStore } from '../stores/planModal'
import type { PlanLimits } from '../api/plan'

type BooleanFeature = {
    [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never
}[keyof PlanLimits]

interface PlanGateProps {
    /** Boolean feature flag (mirrors planLimits.ts on the API). */
    feature:        BooleanFeature
    /** Minimum tier name shown in the upgrade prompt (e.g. "Team", "Enterprise"). */
    upgradeTo?:     string
    /** Optional custom fallback. Default is an UpgradePrompt. */
    fallback?:      ReactNode
    children:       ReactNode
}

/**
 * Renders children only when the tenant's plan supports the feature.
 * Otherwise renders `fallback` (or a default upgrade prompt).
 *
 * Server-side enforcement still runs independently — this only hides
 * what the customer shouldn't see. Bypassing the UI gate doesn't grant
 * access on the API.
 */
export function PlanGate({ feature, upgradeTo, fallback, children }: PlanGateProps) {
    const { hasFeature, isLoading } = usePlan()

    if (isLoading) {
        return <div className="text-sm text-slate-500 dark:text-zinc-500">Loading…</div>
    }

    if (hasFeature(feature)) {
        return <>{children}</>
    }

    return <>{fallback ?? <DefaultUpgradePrompt featureLabel={feature} upgradeTo={upgradeTo} />}</>
}

function DefaultUpgradePrompt({ featureLabel, upgradeTo }: { featureLabel: string; upgradeTo?: string }) {
    const openUpgrade = usePlanModalStore(s => s.openModal)
    return (
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Lock className="mt-0.5 h-4 w-4 text-slate-400" />
            <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-zinc-300">
                    <span className="font-medium">{featureLabel}</span> is not available on your current plan.
                </p>
                <button
                    type="button"
                    onClick={() => openUpgrade(upgradeTo === 'Team' ? 'team' : 'pro')}
                    className="mt-2 inline-block text-xs font-medium text-violet-600 hover:underline"
                >
                    Upgrade {upgradeTo ? `to ${upgradeTo}` : ''} →
                </button>
            </div>
        </div>
    )
}
