import { useState, useEffect } from 'react'
import { Check, ExternalLink, CheckCircle2, Loader2, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { selectTrialPlan } from '../api/plan'
import { requestUpgrade } from '../api/upgrade'
import { createCheckoutSession } from '../api/billing'
import { usePlan } from '../hooks/usePlan'
import { useMe } from '../hooks/useUsers'
import { useAuthStore } from '../stores/auth'

type Tier         = 'trial' | 'pro' | 'team'
type BillingCycle = 'monthly' | 'annual'

interface PlanSelectionModalProps {
    /** Pre-selected card based on ?plan= URL param. */
    initialTier?: Tier
    /** True when LS Checkout has just redirected back here with ?checkout=success.
     *  We swap the modal content to a polling "activating…" state instead of
     *  showing the plan selector again. */
    checkoutSuccess?: boolean
    /**
     * 'onboarding' — forced post-signup plan pick. Logout link top-right, no X.
     *                Shows all 3 cards (Free Trial / Pro / Team).
     * 'upgrade'    — voluntary upgrade from anywhere in the app. X close button
     *                top-right, no Logout. Shows only paid cards (Pro / Team).
     * 'suspended'  — hard lock after lifecycle expiry. Logout link top-right,
     *                no X. Shows only paid cards. Distinct headline.
     */
    mode?: 'onboarding' | 'upgrade' | 'suspended'
    /** Required when mode='upgrade'. */
    onClose?: () => void
}

interface TierMeta {
    id:        Tier
    name:      string
    /** Free tier has no monthly/annual variants. */
    pricing:   { monthly: string; annual: string; monthlyCadence: string; annualCadence: string } | { fixed: string; cadence: string }
    features:  string[]
    cta:       string
}

const TIERS: TierMeta[] = [
    {
        id:       'trial',
        name:     'Free Trial',
        pricing:  { fixed: 'Free', cadence: 'for 30 days' },
        cta:      'Start Free Trial',
        features: [
            'Up to 3 agents',
            '10,000 billed events',
            'Real-time online detection',
            'Post-session scoring',
        ],
    },
    {
        id:       'pro',
        name:     'Pro',
        pricing:  { monthly: '$20', annual: '$200', monthlyCadence: '/ month', annualCadence: '/ year' },
        cta:      'Choose Pro',
        features: [
            'Unlimited agents',
            '50,000 billed events / month',
            'Everything in Free Trial',
        ],
    },
    {
        id:       'team',
        name:     'Team',
        pricing:  { monthly: '$150', annual: '$1,500', monthlyCadence: '/ month', annualCadence: '/ year' },
        cta:      'Choose Team',
        features: [
            '5 seats included',
            '350,000 pooled events / month',
            'Slack / MS Teams / Webhook alerts',
            'Shared workspace + RBAC',
        ],
    },
]

export function PlanSelectionModal({ initialTier, checkoutSuccess, mode = 'onboarding', onClose }: PlanSelectionModalProps) {
    // Existing customers (upgrade or suspended modes) never see / pick the Free Trial card.
    // These two flags are equivalent — `isPaidPicker` reads more clearly at the JSX layer.
    const isExistingCustomerMode = mode === 'upgrade' || mode === 'suspended'
    const isPaidPicker           = isExistingCustomerMode

    const qc       = useQueryClient()
    const router   = useRouter()
    const clearAuth = useAuthStore(s => s.clearAuth)
    const { plan, limits, snapshot } = usePlan()
    const { data: me } = useMe()
    const trialAlreadyConsumed = !!me?.trialConsumedAt

    // Active paid customers don't see the plan they currently have — they
    // can only "change" sideways or upward. Subscription must be 'active'
    // to count as a real paid plan; cancelled/past_due tenants see everything.
    const activeSub = snapshot?.subscription?.status === 'active'
        ? snapshot.subscription
        : null
    const currentPaidTier  : Tier | null = activeSub?.planTier === 'pro' || activeSub?.planTier === 'team'
        ? activeSub.planTier
        : null
    const currentCycle     : BillingCycle | null = activeSub?.billingCycle ?? null

    const defaultTier: Tier = isExistingCustomerMode
        ? (currentPaidTier === 'pro' ? 'team' : 'pro')   // suggest next-best for paid customers
        : (initialTier ?? 'trial')

    const [selected, setSelected] = useState<Tier>(defaultTier)
    const [billing, setBilling]   = useState<BillingCycle>('annual')
    const [submitting, setSubmitting] = useState(false)
    const [pendingPaidTier, setPendingPaidTier] = useState<Tier | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [waited, setWaited] = useState(0)

    // ── Visible tier set + picker shape ──────────────────────────────
    // Computed up-front so the effects below can read isSingleTierPicker
    // without hitting a TDZ. Onboarding mode = all 3 tiers. Upgrade/suspended
    // = paid tiers only, with self-serve downgrades stripped out.
    // Onboarding-mode users always see the Free Trial card (even if they've
    // consumed their one trial) — but the card renders as disabled with an
    // "Already used" badge when trial_consumed_at is set, communicating *why*
    // it's unavailable rather than just hiding it. Upgrade/suspended modes
    // continue to filter trial out entirely since it's never relevant there.
    let visibleTiers = isPaidPicker ? TIERS.filter(t => t.id !== 'trial') : TIERS
    if (currentPaidTier === 'pro' && currentCycle === 'annual') {
        visibleTiers = visibleTiers.filter(t => t.id !== 'pro')
    } else if (currentPaidTier === 'team' && currentCycle === 'annual') {
        visibleTiers = []
    } else if (currentPaidTier === 'team' && currentCycle === 'monthly') {
        visibleTiers = visibleTiers.filter(t => t.id !== 'pro')
    }
    // Single-tier picker mode: only one tier left to choose between cycles of.
    // We drop the monthly/annual toggle and render both cycles as explicit cards.
    const isSingleTierPicker = isPaidPicker && visibleTiers.length === 1

    // Suspended-state countdown — how many days until data deletion
    let daysUntilDeletion: number | null = null
    if (mode === 'suspended' && plan?.lifecycleChangedAt && limits) {
        const enteredSuspendedMs = new Date(plan.lifecycleChangedAt).getTime()
        const deletesAtMs        = enteredSuspendedMs + (limits.suspendedDays * 86_400_000)
        daysUntilDeletion        = Math.max(0, Math.ceil((deletesAtMs - Date.now()) / 86_400_000))
    }

    useEffect(() => { if (initialTier) setSelected(initialTier) }, [initialTier])

    // Defensive: if the current `selected` tier isn't in the visible set
    // (e.g. 'trial' selected but we're in suspended mode), snap to the
    // first visible card. Prevents the button from showing "Start Free Trial"
    // in an existing-customer modal due to state preserved across mode switches.
    useEffect(() => {
        if (isExistingCustomerMode && selected === 'trial') {
            setSelected('pro')
        }
        // Onboarding-mode orphan whose trial was already consumed — don't let
        // selection rest on the disabled Free Trial card.
        if (!isExistingCustomerMode && trialAlreadyConsumed && selected === 'trial') {
            setSelected('pro')
        }
    }, [mode, isExistingCustomerMode, trialAlreadyConsumed, selected])

    // Paid picker: if the user's (selected, billing) pair lands on the
    // "Currently using" disabled card, snap to a clickable card.
    //   - In single-tier mode (only Team visible): flip the billing cycle
    //   - In multi-tier mode: flip the selected tier
    useEffect(() => {
        if (!isPaidPicker) return
        if (!currentPaidTier || !currentCycle) return
        const onTheDisabledCard =
            selected === currentPaidTier && billing === currentCycle
        if (!onTheDisabledCard) return
        if (isSingleTierPicker) {
            // Only one tier visible — switch to the other cycle of the same tier.
            setBilling(currentCycle === 'monthly' ? 'annual' : 'monthly')
        } else {
            // Multi-tier — switch to the other tier (Pro → Team, Team → Pro), keep cycle.
            setSelected(currentPaidTier === 'pro' ? 'team' : 'pro')
        }
    }, [isPaidPicker, isSingleTierPicker, currentPaidTier, currentCycle, selected, billing])


    // When we land back here with ?checkout=success, poll /me/plan until the
    // LS webhook flips plan_tier + onboarding_completed_at. Once that happens
    // the parent OnboardingGate returns null and this whole modal unmounts.
    useEffect(() => {
        if (!checkoutSuccess) return
        const interval = setInterval(() => {
            void qc.invalidateQueries({ queryKey: ['me', 'plan'] })
            setWaited(w => w + 1)
        }, 1500)
        return () => clearInterval(interval)
    }, [checkoutSuccess, qc])

    async function confirm() {
        setSubmitting(true)
        setError(null)
        try {
            if (selected === 'trial') {
                const result = await selectTrialPlan()
                // Orphan-user path: server minted a fresh JWT with the new
                // tenant claim. Swap it into the auth store so the immediate
                // refetch of /me + /me/plan sees the new workspace.
                if (result.accessToken) {
                    const { accessToken, refreshToken } = useAuthStore.getState()
                    if (refreshToken) {
                        useAuthStore.getState().setAccessToken(result.accessToken, refreshToken)
                    }
                    void accessToken  // keep ref for clarity
                }
                // Refresh everything that depends on the new tenant context:
                //   - /me           → user.tenantId for the Sidebar
                //   - /me/plan      → plan snapshot for the dashboard
                //   - /me/tenants   → workspace switcher list
                //   - /tenants/:id  → the workspace card in Settings
                await qc.invalidateQueries({ queryKey: ['me'] })
                await qc.invalidateQueries({ queryKey: ['me', 'plan'] })
                await qc.invalidateQueries({ queryKey: ['me', 'tenants'] })
                await qc.invalidateQueries({ queryKey: ['tenant'] })
            } else {
                // Stripe path: open a Checkout session. Server creates the
                // Stripe customer, returns the hosted Checkout URL, we redirect.
                // On payment success Stripe redirects to /billing/success and
                // the webhook flips plan_tier + opens the gate.
                try {
                    const { url, accessToken: newToken } = await createCheckoutSession({
                        planTier:     selected,
                        billingCycle: billing,
                    })
                    // Orphan-user path: server minted a fresh JWT pointing at
                    // the brand-new workspace. Store it so the post-checkout
                    // /?checkout=success page loads the right tenant context
                    // while the LS webhook race finishes.
                    if (newToken) {
                        const { refreshToken } = useAuthStore.getState()
                        if (refreshToken) {
                            useAuthStore.getState().setAccessToken(newToken, refreshToken)
                        }
                    }
                    window.location.href = url
                    return
                } catch (err) {
                    // Fallback: if billing isn't wired up yet (503 BILLING_NOT_CONFIGURED),
                    // fall back to the manual upgrade-request flow. Useful in dev
                    // environments without LS credentials yet.
                    const msg = (err as Error).message
                    if (!msg.includes('BILLING_NOT_CONFIGURED')) throw err
                    await requestUpgrade({
                        requestedPlanTier: selected,
                        billingCycle:      billing,
                        trigger:           'manual',
                    })
                    setPendingPaidTier(selected)
                }
            }
        } catch (err) {
            setError((err as Error).message || 'Something went wrong.')
        } finally {
            setSubmitting(false)
        }
    }

    function logout() {
        clearAuth()
        void router.navigate({ to: '/login' })
    }


    // Post-LS-checkout success state — wait for webhook to flip plan_tier
    if (checkoutSuccess) {
        return (
            <ModalShell mode={mode} logout={logout} onClose={onClose}>
                <div className="mx-auto max-w-md text-center">
                    <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                    <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-zinc-100">
                        Payment received
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                        Activating your subscription. This usually takes a few seconds.
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Waiting for confirmation from Lemon Squeezy…
                    </div>
                    {waited > 8 && (
                        <p className="mt-6 text-xs text-slate-400">
                            Taking longer than expected — payment is confirmed but the webhook is slow.
                            Refresh the page and your plan will appear.
                        </p>
                    )}
                </div>
            </ModalShell>
        )
    }

    // Post-checkout pending state for Pro/Team (pre-Stripe)
    if (pendingPaidTier) {
        const tierName = pendingPaidTier === 'pro' ? 'Pro' : 'Team'
        return (
            <ModalShell mode={mode} logout={logout} onClose={onClose}>
                <div className="text-center">
                    <div className="text-3xl">📩</div>
                    <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-zinc-100">
                        We're setting up your {tierName} account
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-zinc-400">
                        Our team will reach out within 24 hours with payment instructions. As soon as
                        payment is confirmed, your account unlocks automatically.
                    </p>
                    <button
                        type="button"
                        onClick={() => setPendingPaidTier(null)}
                        className="mt-5 text-xs font-medium text-violet-600 hover:underline"
                    >
                        ← Go back to plan selection
                    </button>
                </div>
            </ModalShell>
        )
    }

    return (
        <ModalShell mode={mode} logout={logout} onClose={onClose}>
            <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
                    {mode === 'suspended' ? 'Your account is suspended' : 'Choose a plan to get started'}
                </h2>
                {mode !== 'suspended' && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                        You can change this any time from Settings → Billing.
                    </p>
                )}
                {mode === 'suspended' && daysUntilDeletion !== null && (
                    <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
                        {daysUntilDeletion === 0
                            ? '⚠ All your data will be permanently deleted today'
                            : daysUntilDeletion === 1
                                ? '⚠ All your data will be permanently deleted tomorrow'
                                : `⚠ All your data will be permanently deleted in ${daysUntilDeletion} days`}
                    </p>
                )}
                {/* Billing-cycle toggle — hidden when there's only a single tier
                    to pick (e.g. Pro annual user choosing between Team monthly/annual),
                    because then the two cards already show both cycles explicitly. */}
                {!isSingleTierPicker && (
                    <div className="mt-4 inline-flex rounded-full bg-slate-100 p-1 text-xs dark:bg-zinc-800">
                        <button
                            type="button"
                            onClick={() => setBilling('monthly')}
                            className={`rounded-full px-4 py-1.5 transition ${
                                billing === 'monthly'
                                    ? 'bg-white text-slate-900 shadow dark:bg-zinc-900 dark:text-zinc-100'
                                    : 'text-slate-500 dark:text-zinc-400'
                            }`}
                        >
                            Bill monthly
                        </button>
                        <button
                            type="button"
                            onClick={() => setBilling('annual')}
                            className={`rounded-full px-4 py-1.5 transition ${
                                billing === 'annual'
                                    ? 'bg-white text-slate-900 shadow dark:bg-zinc-900 dark:text-zinc-100'
                                    : 'text-slate-500 dark:text-zinc-400'
                            }`}
                        >
                            Bill annually
                            <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                2 months free
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {visibleTiers.length === 0 ? (
                <div className="mt-6 rounded border border-slate-200 bg-slate-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-800">
                    <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                        You're on our highest self-serve plan.
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                        Looking for more? <a href="/contact-sales" className="font-medium text-violet-600 hover:underline">Talk to us about Enterprise</a>.
                    </p>
                </div>
            ) : isSingleTierPicker ? (
                // Single tier left — show both monthly + annual cards explicitly.
                // The "Currently using" badge attaches to whichever matches the
                // user's existing (tier, cycle) pair.
                <>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {(['monthly', 'annual'] as BillingCycle[]).map(cycle => {
                            const tier = visibleTiers[0]
                            const isCurrent = tier.id === currentPaidTier && cycle === currentCycle
                            const isSelected = !isCurrent && selected === tier.id && billing === cycle
                            return (
                                <TierCard
                                    key={`${tier.id}-${cycle}`}
                                    tier={tier}
                                    billing={cycle}
                                    selected={isSelected}
                                    isCurrent={isCurrent}
                                    cycleBadge={cycle === 'annual' ? 'Annual · save 2 months' : 'Monthly'}
                                    onSelect={() => {
                                        if (isCurrent) return
                                        setSelected(tier.id)
                                        setBilling(cycle)
                                    }}
                                />
                            )
                        })}
                    </div>
                    {currentPaidTier && (
                        <p className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-400">
                            Your new subscription starts instantly. Any unused time on your current plan is credited automatically.
                        </p>
                    )}
                </>
            ) : (
                <>
                    <div className={`mt-6 grid gap-4 ${visibleTiers.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                        {visibleTiers.map(t => {
                            // The card matching the user's current (tier, cycle) gets the
                            // "Currently using" badge and is disabled. Selection on it is moot.
                            const isCurrent = isPaidPicker
                                && t.id === currentPaidTier
                                && billing === currentCycle
                            // Free Trial card becomes unselectable when the user already
                            // consumed their one trial — shown but visibly disabled with
                            // an "Already used" pill.
                            const isUsedTrial = t.id === 'trial' && trialAlreadyConsumed
                            const disabled    = isCurrent || isUsedTrial
                            return (
                                <TierCard
                                    key={t.id}
                                    tier={t}
                                    billing={billing}
                                    selected={selected === t.id && !disabled}
                                    isCurrent={isCurrent}
                                    isUsedTrial={isUsedTrial}
                                    onSelect={() => {
                                        if (disabled) return
                                        setSelected(t.id)
                                    }}
                                />
                            )
                        })}
                    </div>
                    {currentPaidTier && (
                        <p className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-400">
                            Your new subscription starts instantly. Any unused time on your current plan is credited automatically.
                        </p>
                    )}
                </>
            )}

            {error && (
                <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            {visibleTiers.length > 0 && (
                <button
                    type="button"
                    onClick={confirm}
                    disabled={submitting}
                    className="mt-5 w-full rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                >
                    {submitting
                        ? 'Submitting…'
                        : isPaidPicker
                            ? `Switch to ${TIERS.find(t => t.id === selected)?.name ?? 'plan'} ${billing === 'annual' ? 'Annual' : 'Monthly'}`
                            : visibleTiers.find(t => t.id === selected)?.cta ?? visibleTiers[0]?.cta ?? 'Continue'}
                </button>
            )}

            <p className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-500">
                Looking for Enterprise?{' '}
                <a
                    href="https://dapplepot.com/contact"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-violet-600 hover:underline"
                >
                    Contact sales <ExternalLink className="h-3 w-3" />
                </a>
            </p>
        </ModalShell>
    )
}

function ModalShell({
    logout,
    onClose,
    mode = 'onboarding',
    children,
}: {
    logout: () => void
    onClose?: () => void
    mode?: 'onboarding' | 'upgrade' | 'suspended'
    children: React.ReactNode
}) {
    const showLogout = mode === 'onboarding' || mode === 'suspended'
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-zinc-950/50">
            <div className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-2xl dark:bg-zinc-900">
                <div className="mb-2 flex justify-end">
                    {showLogout ? (
                        <button
                            type="button"
                            onClick={logout}
                            className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                        >
                            Logout
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {children}
            </div>
        </div>
    )
}

function TierCard({ tier, billing, selected, onSelect, isCurrent = false, isUsedTrial = false, cycleBadge }: {
    tier: TierMeta
    billing: BillingCycle
    selected: boolean
    onSelect: () => void
    /** Marks this card as the user's existing plan — disables click + shows "Currently using" pill. */
    isCurrent?: boolean
    /** Marks the Free Trial card as already used — disables click + shows "Already used" pill. */
    isUsedTrial?: boolean
    /** Small badge under the tier name showing the billing cycle of this specific card. */
    cycleBadge?: string
}) {
    // Derive the displayed price for this tier under the current billing cycle.
    const { displayPrice, displayCadence } = 'fixed' in tier.pricing
        ? { displayPrice: tier.pricing.fixed, displayCadence: tier.pricing.cadence }
        : billing === 'monthly'
            ? { displayPrice: tier.pricing.monthly, displayCadence: tier.pricing.monthlyCadence }
            : { displayPrice: tier.pricing.annual,  displayCadence: tier.pricing.annualCadence  }

    const disabled = isCurrent || isUsedTrial
    const borderClass = disabled
        ? 'border-slate-200 bg-slate-50/60 opacity-70 cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800/40'
        : selected
            ? 'border-violet-500 bg-violet-50/30 ring-2 ring-violet-500/10 dark:bg-violet-950/20'
            : 'border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700'

    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            className={`flex flex-col rounded-xl border-2 p-5 text-left transition ${borderClass}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{tier.name}</h3>
                    {cycleBadge && (
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                            {cycleBadge}
                        </p>
                    )}
                </div>
                {isCurrent && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Currently using
                    </span>
                )}
                {isUsedTrial && (
                    <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-zinc-700 dark:text-zinc-300">
                        Already used
                    </span>
                )}
            </div>
            <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-slate-900 dark:text-zinc-100">{displayPrice}</span>
                <span className="text-xs text-slate-500">{displayCadence}</span>
            </div>
            <ul className="mt-4 space-y-1.5 text-xs">
                {tier.features.map(f => (
                    <li key={f} className="flex gap-1.5 text-slate-700 dark:text-zinc-300">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                        {f}
                    </li>
                ))}
            </ul>
        </button>
    )
}
