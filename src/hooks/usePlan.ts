import { useQuery } from '@tanstack/react-query'
import { getMyPlan, getMyUsage, type PlanSnapshot, type PlanLimits, type ChannelType, type UsageTimeSeries } from '../api/plan'
import { useAuthStore } from '../stores/auth'
import { useMyTenants } from './useTenants'

/**
 * Mirrors the exact "gate is open" signal used by `OnboardingGate` so gated
 * queries (alerts, agents, channels, sessions) can skip firing until the
 * server would actually accept them. Otherwise the API returns 409
 * ONBOARDING_PENDING and React Query surfaces it as a visible error.
 */
export function useOnboardingComplete(): boolean {
    const { data: myTenants } = useMyTenants()
    const { plan } = usePlan()
    if (!myTenants || myTenants.length === 0) return false
    return plan?.onboardingCompletedAt != null
}

export function useUsageHistory(days = 30) {
    const isLoggedIn = useAuthStore(s => !!s.accessToken)
    return useQuery({
        queryKey:  ['me', 'usage', days],
        queryFn:   () => getMyUsage(days),
        enabled:   isLoggedIn,
        staleTime: 5 * 60_000,
    })
}

export type { UsageTimeSeries }

/**
 * Single source of truth for the current tenant's plan + usage in the UI.
 * Backs every feature gate, quota gauge, and trial banner in the app.
 *
 * Server (`v1/me/plan`) is always the authoritative source. This hook is
 * for UI rendering — the API enforces every gate independently, so a
 * stale or missing hook value never weakens enforcement.
 */
export function usePlan() {
    const isLoggedIn = useAuthStore(s => !!s.accessToken)
    const q = useQuery({
        queryKey:  ['me', 'plan'],
        queryFn:   getMyPlan,
        enabled:   isLoggedIn,
        staleTime: 60_000,
    })

    const snap = q.data
    const limits: PlanLimits | null = snap?.plan.limits ?? null

    // Convenience predicates — read these in components, not the raw limits.
    function hasFeature(feature: keyof PlanLimits): boolean {
        if (!limits) return false
        const v = limits[feature]
        return v === true
    }

    function hasChannel(channelType: ChannelType): boolean {
        return limits?.allowedChannels.includes(channelType) ?? false
    }

    function canRegisterAnotherAgent(): boolean {
        if (!snap || !limits) return false
        if (limits.maxAgents === null) return true
        return snap.agentCount < limits.maxAgents
    }

    function canInviteAnotherSeat(): boolean {
        if (!snap || !limits || !limits.canInviteTeammates) return false
        if (limits.maxSeats === null) return true
        return snap.seatCount < limits.maxSeats
    }

    return {
        snapshot:               snap as PlanSnapshot | undefined,
        plan:                   snap?.plan,
        limits,
        usage:                  snap?.usage,
        agentCount:             snap?.agentCount ?? 0,
        seatCount:              snap?.seatCount ?? 0,
        trialDaysLeft:          snap?.trialDaysLeft ?? null,
        isLoading:              q.isLoading,
        isTrial:                snap?.plan.planTier === 'trial',
        isPaid:                 snap !== undefined && ['pro', 'team', 'enterprise'].includes(snap.plan.planTier),
        hasFeature,
        hasChannel,
        canRegisterAnotherAgent,
        canInviteAnotherSeat,
    }
}
