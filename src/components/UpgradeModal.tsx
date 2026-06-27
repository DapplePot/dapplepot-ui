import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import type { UpgradeTrigger } from '../api/upgrade'
import { usePlanModalStore } from '../stores/planModal'

interface UpgradeModalProps {
    open:       boolean
    onClose:    () => void
    trigger:    UpgradeTrigger
    /** Optional override headline; defaults derived from trigger. */
    headline?:  string
}

const TRIGGER_COPY: Record<UpgradeTrigger, { title: string; body: string; cta: string }> = {
    agent_cap: {
        title: "You've hit the 3-agent trial limit",
        body:  'Upgrade to Pro to register unlimited agents and keep building.',
        cta:   'See plans',
    },
    event_quota: {
        title: 'Out of trial events',
        body:  "You've used all 10,000 events in your trial. Upgrade to Pro for 50,000 events / month.",
        cta:   'See plans',
    },
    day_28_warning: {
        title: 'Your trial ends in 2 days',
        body:  "Lock in 2 months free with annual billing if you upgrade today.",
        cta:   'See plans',
    },
    day_31_expired: {
        title: 'Trial expired — read-only mode',
        body:  "Your trial ended. You can still view your data during the 7-day grace period. Upgrade now to restore full access.",
        cta:   'Upgrade',
    },
    manual: {
        title: 'Upgrade your plan',
        body:  'Pick the plan that fits your team.',
        cta:   'See plans',
    },
}

export function UpgradeModal({ open, onClose, trigger, headline }: UpgradeModalProps) {
    const openPlanModal = usePlanModalStore(s => s.openModal)
    if (!open) return null
    const copy = TRIGGER_COPY[trigger]

    function seePlans() {
        onClose()
        openPlanModal()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                        {headline ?? copy.title}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{copy.body}</p>

                <div className="mt-5 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={seePlans}
                        className="block w-full rounded bg-violet-600 py-2 text-center text-sm font-medium text-white hover:bg-violet-500"
                    >
                        {copy.cta}
                    </button>
                    <Link
                        to="/contact-sales"
                        onClick={onClose}
                        className="block w-full rounded border border-slate-300 py-2 text-center text-sm font-medium hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                        Need Enterprise? Contact sales
                    </Link>
                    <button
                        onClick={onClose}
                        className="mt-2 text-center text-xs text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                        Not now
                    </button>
                </div>
            </div>
        </div>
    )
}
