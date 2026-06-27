import { apiClient } from './client'
import type { PlanTier } from './plan'

export type UpgradeTrigger =
    | 'agent_cap'
    | 'event_quota'
    | 'day_28_warning'
    | 'day_31_expired'
    | 'manual'

export function requestUpgrade(body: {
    requestedPlanTier: 'pro' | 'team' | 'enterprise'
    billingCycle?:     'monthly' | 'annual'
    trigger?:          UpgradeTrigger
    note?:             string
}): Promise<{ ok: true; requestId: string }> {
    return apiClient.post('v1/me/upgrade-request', { json: body }).json()
}

export function submitContactSales(body: {
    name:                   string
    email:                  string
    company?:               string
    monthlyVolumeEstimate?: string
    deploymentPreference?:  'saas' | 'self_hosted_vpc'
    complianceNeeds?:       string
    notes?:                 string
}): Promise<{ ok: true; leadId: string }> {
    return apiClient.post('v1/leads/contact-sales', { json: body }).json()
}

// Re-export PlanTier for callers
export type { PlanTier }
