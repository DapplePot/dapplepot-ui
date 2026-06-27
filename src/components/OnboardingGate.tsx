import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { usePlan } from '../hooks/usePlan'
import { useMyTenants } from '../hooks/useTenants'
import { useAuthStore } from '../stores/auth'
import { usePlanModalStore } from '../stores/planModal'
import { PlanSelectionModal } from './PlanSelectionModal'
import { SuspendedScreen } from './SuspendedScreen'

/**
 * Renders the post-signup plan-selection modal over a greyed-out
 * dashboard until the tenant has confirmed a plan.
 *
 * Logic:
 *   - plan.onboardingCompletedAt !== null  → render nothing (gate open)
 *   - plan loading                         → render nothing (don't flash modal)
 *   - plan.onboardingCompletedAt === null  → render modal + lock backdrop
 *
 * Note: server-side `requireOnboardingComplete` middleware enforces this
 * independently — the modal is just UX. A user who bypasses the modal
 * client-side still gets 409 ONBOARDING_PENDING from every gated route.
 */
export function OnboardingGate() {
    const { plan, isLoading: planLoading } = usePlan()
    // Source of truth for "does the user have any workspace" — the same query
    // that drives the sidebar workspace switcher. If the list is empty, they
    // have no workspaces and should see the plan-selection modal.
    const { data: myTenants, isLoading: tenantsLoading } = useMyTenants()
    const role     = useAuthStore(s => s.user?.role)
    const pathname = useRouterState({ select: (s) => s.location.pathname })
    const search   = useRouterState({ select: (s) => s.location.search }) as Record<string, unknown>
    const [initialTier, setInitialTier] = useState<'trial' | 'pro' | 'team' | undefined>()

    // Pull ?plan=trial|pro|team from the URL on mount so the matching card
    // pre-highlights when the user arrives from the marketing pricing page.
    useEffect(() => {
        const raw = String(search?.plan ?? '').toLowerCase()
        if (raw === 'trial' || raw === 'pro' || raw === 'team') {
            setInitialTier(raw)
        }
    }, [search])

    // Lemon Squeezy redirects users back to /?checkout=success after a paid
    // checkout. We use that signal to flip the modal to a "payment received,
    // activating…" state instead of showing the plan selector again while
    // the webhook race finishes.
    const checkoutSuccess = String(search?.checkout ?? '') === 'success'

    // On-demand upgrade modal (opened from any "Upgrade" button)
    const upgradeOpen        = usePlanModalStore(s => s.open)
    const upgradeInitialTier = usePlanModalStore(s => s.initialTier)
    const closeUpgradeModal  = usePlanModalStore(s => s.closeModal)

    // Never render on superadmin portal — superadmin operates across tenants,
    // doesn't have a "their plan" in the customer sense.
    if (role === 'superadmin') return null
    if (pathname.startsWith('/admin')) return null

    // Wait for the tenant list to resolve so we don't flash the dashboard
    // behind the modal during the initial fetch.
    if (tenantsLoading) return null

    // Orphan user — they're logged in but belong to zero workspaces. Same
    // signal that drives the sidebar workspace switcher. Show the plan
    // selection modal exactly like a fresh signup.
    if (myTenants && myTenants.length === 0) {
        return (
            <PlanSelectionModal
                initialTier={initialTier}
                checkoutSuccess={checkoutSuccess}
                mode="onboarding"
            />
        )
    }

    if (planLoading) return null

    // Suspended tenants — pure hard-lock screen, takes precedence over everything
    if (plan?.lifecycleState === 'suspended' || plan?.lifecycleState === 'deleted') {
        return <SuspendedScreen />
    }

    // Onboarding-incomplete tenants get the forced post-signup modal
    if (!plan?.onboardingCompletedAt) {
        return (
            <PlanSelectionModal
                initialTier={initialTier}
                checkoutSuccess={checkoutSuccess}
                mode="onboarding"
            />
        )
    }

    // Existing customer triggered an upgrade from somewhere in the app
    if (upgradeOpen) {
        return (
            <PlanSelectionModal
                initialTier={upgradeInitialTier}
                mode="upgrade"
                onClose={closeUpgradeModal}
            />
        )
    }

    return null
}
