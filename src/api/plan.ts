import { apiClient } from './client'

export type PlanTier = 'internal' | 'trial' | 'pro' | 'team' | 'enterprise'

export type ChannelType = 'slack' | 'msteams' | 'webhook' | 'pagerduty'

export interface PlanLimits {
    maxAgents:            number | null
    eventsPerPeriod:      number | null
    maxSeats:             number | null
    trialDays:            number | null
    /** Days a trial tenant stays in read-only before suspension (90 default). */
    readonlyDays:         number
    /** Days a suspended tenant retains data before deletion (90 default). */
    suspendedDays:        number
    allowedChannels:      ChannelType[]
    canInviteTeammates:   boolean
    canExportSealedAudit: boolean
    overageBillable:      boolean
    isSelfServe:          boolean
    displayName:          string
}

export type LifecycleState = 'active' | 'readonly' | 'suspended' | 'deleted'

export interface PlanSnapshot {
    plan: {
        tenantId:              string
        planTier:              PlanTier
        trialEndsAt:           string | null
        planChangedAt:         string
        /** NULL until the user has chosen a plan in the post-signup modal.
         *  Drives the OnboardingGate. */
        onboardingCompletedAt: string | null
        /** Lifecycle state — drives readonly banner and suspended hard-lock UI. */
        lifecycleState:        LifecycleState
        /** When the tenant entered its current lifecycle state. Used for countdowns. */
        lifecycleChangedAt:    string
        enabled:               boolean
        limits:                PlanLimits
    }
    subscription: {
        planTier:           'pro' | 'team' | 'enterprise'
        billingCycle:       'monthly' | 'annual'
        status:             'active' | 'past_due' | 'cancelled' | 'paused'
        currentPeriodStart: string
        currentPeriodEnd:   string
        cancelAt:           string | null
    } | null
    usage: {
        eventsUsed:    number
        eventsQuota:   number
        overageEvents: number
        pct:           number
        periodStart:   string
        periodEnd:     string
    }
    agentCount:    number
    seatCount:     number
    trialDaysLeft: number | null
}

export function getMyPlan(): Promise<PlanSnapshot> {
    return apiClient.get('v1/me/plan').json()
}

export interface UsageTimeSeries {
    days:    number
    daily:   { day: string; events: number }[]
    byAgent: { agentId: string; events: number }[]
}

export function getMyUsage(days = 30): Promise<UsageTimeSeries> {
    return apiClient.get(`v1/me/usage?days=${days}`).json()
}

/** Confirms Free Trial from the post-signup plan-selection modal.
 *  Sets trial_ends_at=now+30d and onboarding_completed_at=now() server-side.
 *  Returns an `accessToken` only when called by an orphan user (no tenant
 *  before this call) — the FE must swap it into the auth store so subsequent
 *  requests carry the new tenant claim. */
export function selectTrialPlan(): Promise<{ ok: true; accessToken?: string | null }> {
    return apiClient.post('v1/me/onboarding/select-trial').json()
}
