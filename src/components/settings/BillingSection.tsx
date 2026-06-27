import { Zap, Users, Bot } from 'lucide-react'
import { usePlan } from '../../hooks/usePlan'
import { usePlanModalStore } from '../../stores/planModal'

/**
 * "Billing & Usage" section inside Settings.
 * Shows the current plan card, current-period quota gauge, agent/seat
 * counters, a 30-day daily-usage sparkline, and the top agents by
 * billed-event consumption.
 */
export function BillingSection() {
    const { plan, limits, usage, agentCount, seatCount, trialDaysLeft, isLoading, snapshot } = usePlan()
    const openUpgrade = usePlanModalStore(s => s.openModal)

    if (isLoading || !plan || !limits || !usage) {
        return <div className="text-sm text-slate-500">Loading…</div>
    }

    const subscription = snapshot?.subscription
    const quotaPct = usage.eventsQuota > 0 ? Math.min(usage.eventsUsed / usage.eventsQuota, 1) : 0

    return (
        <div className="space-y-8">
            {/* Plan card */}
            <div className="rounded border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-500">Current plan</p>
                        <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-zinc-100">{limits.displayName}</h3>
                        {trialDaysLeft !== null && (
                            <p className={`mt-1 text-xs ${trialDaysLeft <= 7 ? 'text-amber-600' : 'text-slate-500 dark:text-zinc-400'}`}>
                                {trialDaysLeft <= 0
                                    ? 'Trial ended — grace period'
                                    : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in trial`}
                            </p>
                        )}
                        {subscription && subscription.status !== 'past_due' && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                                {subscription.cancelAt
                                    ? new Date(subscription.cancelAt) < new Date()
                                        ? <>Access ended on <span className="font-medium text-slate-700 dark:text-zinc-300">{formatPeriodDate(subscription.cancelAt)}</span></>
                                        : <>Access ends on <span className="font-medium text-slate-700 dark:text-zinc-300">{formatPeriodDate(subscription.cancelAt)}</span></>
                                    : <>Renews {subscription.billingCycle === 'monthly' ? 'monthly' : 'annually'} on <span className="font-medium text-slate-700 dark:text-zinc-300">{formatPeriodDate(subscription.currentPeriodEnd)}</span></>}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => openUpgrade()}
                        className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
                    >
                        {plan.planTier === 'enterprise'
                            ? 'Contact us'
                            : (plan.planTier === 'trial' || plan.planTier === 'internal')
                                ? 'Upgrade plan'
                                : 'Change plan'}
                    </button>
                </div>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Stat icon={Zap}  label="Events this month" value={`${usage.eventsUsed.toLocaleString()} / ${usage.eventsQuota.toLocaleString()}`} sub={`${(quotaPct * 100).toFixed(1)}% used`} />
                <Stat icon={Bot}  label="Registered agents" value={`${agentCount}${limits.maxAgents !== null ? ` / ${limits.maxAgents}` : ''}`} sub={limits.maxAgents !== null ? 'capped' : 'unlimited'} />
                <Stat icon={Users} label="Seats"             value={`${seatCount}${limits.maxSeats !== null ? ` / ${limits.maxSeats}` : ''}`} sub={limits.maxSeats !== null ? 'capped' : 'unlimited'} />
            </div>


        </div>
    )
}

function formatPeriodDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Zap; label: string; value: string; sub: string }) {
    return (
        <div className="rounded border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <Icon className="h-3 w-3" /> {label}
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-zinc-100">{value}</div>
            <div className="mt-0.5 text-xs text-slate-500">{sub}</div>
        </div>
    )
}

